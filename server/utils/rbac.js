// Project RBAC helpers
function isProjectMember(userId, project) {
  if (!project) return false;
  const uid = userId?.toString();
  if (project.createdBy && (project.createdBy._id || project.createdBy).toString() === uid) {
    return true;
  }
  if (!project.teamMembers || !Array.isArray(project.teamMembers)) return false;
  return project.teamMembers.some((m) => {
    const memberId = (m.user?._id || m.user)?.toString();
    return memberId === uid;
  });
}

function isProjectOwner(userId, project) {
  if (!project) return false;
  const uid = userId?.toString();
  if (project.createdBy && (project.createdBy._id || project.createdBy).toString() === uid) {
    return true;
  }
  if (!project.teamMembers || !Array.isArray(project.teamMembers)) return false;
  return project.teamMembers.some((m) => {
    const memberId = (m.user?._id || m.user)?.toString();
    return memberId === uid && (m.role === "Owner" || m.role === "Admin");
  });
}

module.exports = { isProjectMember, isProjectOwner };
