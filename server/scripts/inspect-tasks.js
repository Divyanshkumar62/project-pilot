const mongoose = require('mongoose');
const Task = require('./models/Task');
const Project = require('./models/Project');
require('dotenv').config();

const inspectTasks = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const allTasks = await Task.find({}).limit(5);
    const allProjects = await Project.find({});
    
    console.log('\n=== PROJECTS ===');
    allProjects.forEach(project => {
      console.log(`Project: ${project.title} (ID: ${project._id})`);
    });
    
    console.log('\n=== TASKS ===');
    allTasks.forEach(task => {
      console.log(`Task: ${task.title}`);
      console.log(`  - projectId: ${task.projectId}`);
      console.log(`  - projectId type: ${typeof task.projectId}`);
      console.log('  - Full task object keys:', Object.keys(task.toObject()));
      console.log('---');
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
};

inspectTasks();
