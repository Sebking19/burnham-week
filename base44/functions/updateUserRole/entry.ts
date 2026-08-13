import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { userId, role, addSubrole } = body;

    // Allow users to update their own role, or admins to update anyone's
    if (user.id !== userId && user.role !== 'admin' && user.role !== 'admiral' && user.role !== 'owner') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    let updatePayload = {};

    if (addSubrole) {
      // Fetch current user data to get existing roles array
      const targetUsers = await base44.asServiceRole.entities.User.filter({ id: userId });
      const targetUser = targetUsers[0];
      const currentRoles = targetUser?.roles || [];
      if (!currentRoles.includes(addSubrole)) {
        updatePayload.roles = [...currentRoles, addSubrole];
      } else {
        // Already has subrole, nothing to do
        return Response.json({ message: 'Already has this subrole' });
      }
    } else if (role) {
      updatePayload.role = role;
    } else {
      return Response.json({ error: 'No role or addSubrole provided' }, { status: 400 });
    }

    const updated = await base44.asServiceRole.entities.User.update(userId, updatePayload);
    return Response.json(updated);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});