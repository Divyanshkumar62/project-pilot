const mongoose = require('mongoose');
const Task = require('./models/Task');
const Project = require('./models/Project');
require('dotenv').config();

const cleanupOrphanedTasks = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Get all tasks
    const allTasks = await Task.find({});
    console.log(`Found ${allTasks.length} total tasks`);

    // Get all existing project IDs
    const existingProjects = await Project.find({}, '_id');
    const existingProjectIds = existingProjects.map(p => p._id.toString());
    console.log(`Found ${existingProjectIds.length} existing projects`);

    // Find orphaned tasks
    const orphanedTasks = allTasks.filter(task => {
      const taskProjectId = task.project ? task.project.toString() : null;
      return taskProjectId && !existingProjectIds.includes(taskProjectId);
    });

    console.log(`Found ${orphanedTasks.length} orphaned tasks`);

    if (orphanedTasks.length > 0) {
      // Delete orphaned tasks
      const orphanedTaskIds = orphanedTasks.map(task => task._id);
      const result = await Task.deleteMany({ _id: { $in: orphanedTaskIds } });
      
      console.log(`Deleted ${result.deletedCount} orphaned tasks`);
      
      // List the deleted tasks
      orphanedTasks.forEach(task => {
        console.log(`- Deleted task: "${task.title}" (Project ID: ${task.project})`);
      });
    } else {
      console.log('No orphaned tasks found');
    }

    await mongoose.disconnect();
    console.log('Cleanup completed');
  } catch (error) {
    console.error('Cleanup error:', error);
    process.exit(1);
  }
};

cleanupOrphanedTasks();
