const express = require("express");
const router = express.Router();
const { check, body } = require("express-validator");
const auth = require("../middleware/auth");

const {
  createProject,
  getProject,
  getProjectById,
  updateProject,
  deleteProject,
  getProjectDashboard,
  renameProject,
  archiveProject,
  transferOwnership,
  addMilestone,
  updateMilestone,
  deleteMilestone,
} = require("../controllers/project.controller.js");

const resourceController = require("../controllers/resource.controller");

router.post(
  "/",
  [
    auth,
    check("title", "Title is required").not().isEmpty(),
    check("description", "Description is required").not().isEmpty(),
    check("startDate", "Start Date is required").not().isEmpty(),
  ],
  createProject
);

// Project dashboard analytics/summary
router.get("/:projectId/dashboard", auth, getProjectDashboard);

// GET /api/projects?q=keyword&page=1&limit=10
// Supports search by name/description and pagination
router.get("/", auth, getProject);
router.get("/:id", auth, getProjectById);
router.put("/:id", auth, updateProject);

// Project settings enhancements (controllers enforce project creator ownership)
router.put("/:projectId/rename", auth, renameProject);
router.put("/:projectId/archive", auth, archiveProject);
router.put(
  "/:projectId/transfer-ownership/:userId",
  auth,
  transferOwnership
);
router.delete("/:id", auth, deleteProject);

const getMilestones = async (req, res) => {
  try {
    const project = await require("../models/Project").findById(req.params.projectId);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    const isMember = project.teamMembers && project.teamMembers.some(member =>
      member.user.toString() === req.user.id
    );
    const isCreator = project.createdBy.toString() === req.user.id;

    if (!isMember && !isCreator) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(project.milestones || []);
  } catch (error) {
    console.error('Get milestones error:', error);
    res.status(500).json({ message: 'Error retrieving milestones' });
  }
};

// Milestone routes
router.get('/:projectId/milestones', auth, getMilestones);

router.post('/:projectId/milestones', [
  auth,
  body('title').isLength({ min: 1, max: 100 }).trim(),
  body('description').optional().isLength({ max: 500 }).trim(),
  body('dueDate').isISO8601(),
  body('tasks').optional().isArray()
], addMilestone);

router.put('/:projectId/milestones/:milestoneId', [
  auth,
  body('status').isIn(['Pending', 'Completed', 'Overdue'])
], updateMilestone);

router.delete('/:projectId/milestones/:milestoneId', auth, deleteMilestone);

// Resource Management Routes
router.get('/:projectId/resources', auth, resourceController.getProjectResources);
router.post('/:projectId/resources/allocate', auth, [
  body('projectId').isMongoId(),
  body('hoursAllocated').isInt({ min: 1, max: 80 }),
  body('startDate').isISO8601(),
  body('endDate').isISO8601()
], resourceController.allocateResource);

router.put('/:projectId/resources/allocations/:allocationId', auth, [
  body('hoursAllocated').optional().isInt({ min: 1, max: 80 }),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601(),
  body('status').optional().isIn(['Active', 'Completed', 'Cancelled'])
], resourceController.updateAllocation);

router.delete('/:projectId/resources/allocations/:allocationId', auth, resourceController.removeAllocation);

module.exports = router;
