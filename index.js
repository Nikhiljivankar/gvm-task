require("dotenv").config();
const express = require('express');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const bodyParser = require('body-parser');
const swaggerUi = require("swagger-ui-express");
const awsWorker = require("./aws.controller");
const swaggerDocument = require("./docs/swagger.json");

const app = express();
app.use(bodyParser.json());
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, uuidv4() + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

// In-memory storage for tasks, users
let tasks = [];
let users = [];

// Middleware to check JWT token for authentication
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// swagger docs
app.use(`/api/v1/docs`, swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Create a new task
app.post('/tasks', authenticateToken, (req, res) => {
    const { title, description } = req.body;
    const newTask = {
        id: uuidv4(),
        title,
        description
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// Get all tasks
app.get('/tasks', authenticateToken, (req, res) => {
    res.json(tasks);
});

// Get a single task by ID
app.get('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const task = tasks.find(task => task.id === taskId);
    if (!task) {
        return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
});

// Update a task by ID
app.put('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const { title, description } = req.body;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    tasks[taskIndex] = {
        ...tasks[taskIndex],
        title: title || tasks[taskIndex].title,
        description: description || tasks[taskIndex].description
    };
    res.json(tasks[taskIndex]);
});

// Delete a task by ID
app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = req.params.id;
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
        return res.status(404).json({ error: 'Task not found' });
    }
    tasks.splice(taskIndex, 1);
    res.json({ message: 'Task deleted successfully' });
});

//multiple upload api
app.post('/upload', authenticateToken, upload.array('files'), (req, res) => {
    //here you can write code for uploading files to s3 server and return s3 urls in response or store it into db
    res.send('Files uploaded successfully');
});
// code for s3 upload and cloudinary
// app.post('/upload', authenticateToken, upload.array('files'), awsWorker.doMultipleUpload);

//register user
app.post('/register', async (req, res) => {
    try {
        const userExist = users.find(user => user.username === req.body.username);
        if (userExist) {
            return res.status(400).send('user already exist');
        }
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = { username: req.body.username, password: hashedPassword };
        users.push(user);
        res.status(201).send('User registered successfully');
    } catch(err) {
        res.status(500).send('Failed to register user',err);
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    const user = users.find(user => user.username === req.body.username);
    if (user == null) {
        return res.status(400).send('Cannot find user');
    }
    try {
        if (await bcrypt.compare(req.body.password, user.password)) {
            const accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET);
            res.json({ accessToken: accessToken });
        } else {
            res.status(401).send('Incorrect password');
        }
    } catch(err) {
        res.status(500).send('Internal server error', err);
    }
});

// Role-based authorization for tasks
app.post('/tasks/admin', authenticateToken, (req, res) => {
    if (req.user.role !== 'admin') {
        return res.status(403).send('Forbidden');
    }
    const task = req.body;
    tasks.push(task);
    res.status(201).send('Task created by admin successfully');
});


// Start the server
const PORT = process.env.POST || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
