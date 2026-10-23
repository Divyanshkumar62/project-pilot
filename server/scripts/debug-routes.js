// Debug script to check route handlers
console.log('=== Debug Route Handlers ===');

const resourceController = require('./controllers/resource.controller');
console.log('Resource controller:', typeof resourceController);
console.log('updateAllocation:', typeof resourceController.updateAllocation);
console.log('removeAllocation:', typeof resourceController.removeAllocation);
console.log('getProjectResources:', typeof resourceController.getProjectResources);
console.log('allocateResource:', typeof resourceController.allocateResource);

console.log('\nResource controller keys:');
console.log(Object.keys(resourceController));

if (resourceController.updateAllocation) {
  console.log('updateAllocation function body exists');
} else {
  console.log('updateAllocation is undefined!');
}

if (resourceController.removeAllocation) {
  console.log('removeAllocation function body exists');
} else {
  console.log('removeAllocation is undefined!');
}

console.log('\n=== Debug Complete ===');
