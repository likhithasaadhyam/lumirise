import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { authenticate, requirePermission } from '../middleware/auth.js';
import { recordAuditLog } from '../utils/audit.js';

const router = Router();
router.use(authenticate);

// ==========================================
// DEPARTMENTS & SHIFTS
// ==========================================
router.get('/departments', requirePermission(['employees.view', 'settings.view']), async (req: Request, res: Response) => {
  try {
    const depts = await prisma.department.findMany({
      where: { organizationId: req.organizationId! },
      include: { _count: { select: { employees: true, jobOpenings: true } } },
      orderBy: { name: 'asc' },
    });
    return res.json(depts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/departments', requirePermission('settings.view'), async (req: Request, res: Response) => {
  try {
    const { name, code, description } = req.body;
    const dept = await prisma.department.create({
      data: {
        organizationId: req.organizationId!,
        name,
        code,
        description,
      },
    });
    return res.status(201).json(dept);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/shifts', requirePermission(['attendance.view', 'employees.view']), async (req: Request, res: Response) => {
  try {
    const shifts = await prisma.shift.findMany({
      where: { organizationId: req.organizationId! },
      include: { _count: { select: { employees: true } } },
      orderBy: { startTime: 'asc' },
    });
    return res.json(shifts);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// EMPLOYEES
// ==========================================
router.get('/employees', requirePermission('employees.view'), async (req: Request, res: Response) => {
  try {
    const { departmentId, status } = req.query;
    const where: any = { organizationId: req.organizationId! };
    if (departmentId && departmentId !== 'ALL') where.departmentId = String(departmentId);
    if (status && status !== 'ALL') where.status = String(status);

    const employees = await prisma.employee.findMany({
      where,
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
      orderBy: { employeeCode: 'asc' },
    });
    return res.json(employees);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.get('/employees/:id', requirePermission(['employees.view', 'my_profile.view']), async (req: Request, res: Response) => {
  try {
    // If not employees.view, only allow if it's the user's own employee record
    if (!req.user?.permissions.includes('employees.view') && req.user?.role !== 'ADMIN') {
      if (req.user?.employeeId !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden: You can only view your own profile.' });
      }
    }

    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        subordinates: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
            createdAt: true,
          },
        },
        attendanceRecords: { take: 30, orderBy: { date: 'desc' } },
        leaveRequests: { take: 15, orderBy: { createdAt: 'desc' }, include: { leaveType: true } },
        payrollSlips: { take: 12, orderBy: { createdAt: 'desc' }, include: { payrollPeriod: true } },
        performanceReviews: { take: 5, orderBy: { createdAt: 'desc' } },
        onboardingTasks: true,
      },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    return res.json(employee);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/employees', requirePermission('employees.manage'), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      departmentId,
      designation,
      roleId,
      shiftId,
      managerId,
      joiningDate,
      employmentType,
      workLocation,
      basicSalary,
      allowances,
      deductions,
      // User Account Linking Options
      enableLogin,
      loginEmail,
      password,
    } = req.body;

    const normalizedEmail = email ? email.trim().toLowerCase() : '';
    if (!normalizedEmail) {
      return res.status(400).json({ message: 'Email address is required.' });
    }

    // 1. Check if an employee with this email already exists in this organization
    const existingEmp = await prisma.employee.findUnique({
      where: {
        organizationId_email: {
          organizationId: req.organizationId!,
          email: normalizedEmail,
        },
      },
    });

    if (existingEmp) {
      return res.status(400).json({
        message: `An employee with the email "${normalizedEmail}" already exists (${existingEmp.firstName} ${existingEmp.lastName} - ${existingEmp.employeeCode}). Please use a unique email address.`,
      });
    }

    // 2. If login is enabled, validate user account email uniqueness upfront
    const targetLoginEmail = enableLogin ? (loginEmail ? loginEmail.trim().toLowerCase() : normalizedEmail) : null;
    let existingUserAccount: any = null;

    if (enableLogin && targetLoginEmail) {
      existingUserAccount = await prisma.user.findFirst({
        where: { organizationId: req.organizationId!, email: targetLoginEmail },
      });
      if (existingUserAccount && existingUserAccount.employeeId) {
        return res.status(400).json({
          message: `A login user account with email "${targetLoginEmail}" is already linked to another employee.`,
        });
      }
    }

    // 3. Resolve role: provided roleId or fallback to EMPLOYEE role
    let assignedRoleId = roleId || null;
    if (enableLogin && !assignedRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { organizationId: req.organizationId!, name: 'EMPLOYEE' },
      });
      assignedRoleId = defaultRole ? defaultRole.id : null;
    }

    // 4. Generate collision-proof sequential employee code
    const count = await prisma.employee.count({ where: { organizationId: req.organizationId! } });
    let codeNum = count + 1;
    let employeeCode = `EMP-${1000 + codeNum}`;
    while (
      await prisma.employee.findUnique({
        where: {
          organizationId_employeeCode: {
            organizationId: req.organizationId!,
            employeeCode,
          },
        },
      })
    ) {
      codeNum++;
      employeeCode = `EMP-${1000 + codeNum}`;
    }

    const employee = await prisma.employee.create({
      data: {
        organizationId: req.organizationId!,
        employeeCode,
        firstName: firstName ? firstName.trim() : '',
        lastName: lastName ? lastName.trim() : '',
        email: normalizedEmail,
        phone,
        departmentId,
        designation,
        roleId: assignedRoleId,
        shiftId: shiftId || null,
        managerId: managerId || null,
        joiningDate: joiningDate ? new Date(joiningDate) : new Date(),
        employmentType: employmentType || 'FULL_TIME',
        workLocation: workLocation || 'Headquarters',
        basicSalary: Number(basicSalary) || 0,
        allowances: Number(allowances) || 0,
        deductions: Number(deductions) || 0,
        status: 'ACTIVE',
      },
      include: { department: true, role: true, shift: true },
    });

    // 5. If login enabled, create or link the User account
    if (enableLogin && targetLoginEmail) {
      const initialPassword = password && password.trim() ? password.trim() : 'Password123!';
      const passwordHash = await bcrypt.hash(initialPassword, 10);

      if (existingUserAccount) {
        await prisma.user.update({
          where: { id: existingUserAccount.id },
          data: {
            employeeId: employee.id,
            roleId: assignedRoleId || existingUserAccount.roleId,
            passwordHash,
            status: 'ACTIVE',
          },
        });
      } else {
        await prisma.user.create({
          data: {
            organizationId: req.organizationId!,
            email: targetLoginEmail,
            passwordHash,
            firstName: employee.firstName,
            lastName: employee.lastName,
            roleId: assignedRoleId!,
            employeeId: employee.id,
            status: 'ACTIVE',
          },
        });
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'CREATE',
      entity: 'Employee',
      entityId: employee.id,
      details: `Added new employee ${employee.firstName} ${employee.lastName} [${employee.employeeCode}] - ${employee.designation}${enableLogin ? ' (Login Enabled)' : ''}`,
    });

    const fullEmployee = await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
          },
        },
      },
    });

    return res.status(201).json(fullEmployee);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(400).json({
        message: 'Unique constraint error: An employee or user account with this email/code already exists in this organization.',
      });
    }
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// EMPLOYEE ACCOUNT & CREDENTIALS MANAGEMENT
// ==========================================

// Enable or link User Account for an Employee
router.post('/employees/:id/enable-login', requirePermission('employees.manage'), async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { user: true },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const { loginEmail, roleId, password } = req.body;
    const targetEmail = (loginEmail || employee.email).trim().toLowerCase();

    // Determine target role
    let assignedRoleId = roleId || employee.roleId;
    if (!assignedRoleId) {
      const defaultRole = await prisma.role.findFirst({
        where: { organizationId: req.organizationId!, name: 'EMPLOYEE' },
      });
      assignedRoleId = defaultRole?.id;
    }

    if (employee.user) {
      // User account already exists: reactivate and update credentials/role if provided
      const updateData: any = {
        status: 'ACTIVE',
        email: targetEmail,
      };
      if (assignedRoleId) updateData.roleId = assignedRoleId;
      if (password && password.trim()) {
        updateData.passwordHash = await bcrypt.hash(password.trim(), 10);
      }

      await prisma.user.update({
        where: { id: employee.user.id },
        data: updateData,
      });

      if (assignedRoleId && assignedRoleId !== employee.roleId) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: { roleId: assignedRoleId },
        });
      }
    } else {
      // Check if user with targetEmail exists in organization
      const existingUser = await prisma.user.findFirst({
        where: { organizationId: req.organizationId!, email: targetEmail },
      });

      const initialPassword = password && password.trim() ? password.trim() : 'Password123!';
      const passwordHash = await bcrypt.hash(initialPassword, 10);

      if (existingUser) {
        if (existingUser.employeeId && existingUser.employeeId !== employee.id) {
          return res.status(400).json({
            message: `User account "${targetEmail}" is already linked to another employee.`,
          });
        }
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            employeeId: employee.id,
            roleId: assignedRoleId || existingUser.roleId,
            passwordHash,
            status: 'ACTIVE',
          },
        });
      } else {
        await prisma.user.create({
          data: {
            organizationId: req.organizationId!,
            email: targetEmail,
            passwordHash,
            firstName: employee.firstName,
            lastName: employee.lastName,
            roleId: assignedRoleId!,
            employeeId: employee.id,
            status: 'ACTIVE',
          },
        });
      }

      if (assignedRoleId && assignedRoleId !== employee.roleId) {
        await prisma.employee.update({
          where: { id: employee.id },
          data: { roleId: assignedRoleId },
        });
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'UPDATE',
      entity: 'User',
      entityId: employee.id,
      details: `Enabled Lumirise login for employee ${employee.firstName} ${employee.lastName} [${employee.employeeCode}] (${targetEmail})`,
    });

    const updated = await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Disable Login for an Employee
router.post('/employees/:id/disable-login', requirePermission('employees.manage'), async (req: Request, res: Response) => {
  try {
    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { user: true },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    if (employee.user) {
      await prisma.user.update({
        where: { id: employee.user.id },
        data: { status: 'INACTIVE' },
      });

      await recordAuditLog({
        organizationId: req.organizationId!,
        userId: req.user!.userId,
        userName: `${req.user!.firstName} ${req.user!.lastName}`,
        action: 'UPDATE',
        entity: 'User',
        entityId: employee.user.id,
        details: `Deactivated/Disabled Lumirise login for employee ${employee.firstName} ${employee.lastName} [${employee.employeeCode}]`,
      });
    }

    const updated = await prisma.employee.findUnique({
      where: { id: employee.id },
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
          },
        },
      },
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Reset Password for Employee User Account
router.post('/employees/:id/reset-password', requirePermission('employees.manage'), async (req: Request, res: Response) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim().length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { user: true },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });
    if (!employee.user) {
      return res.status(400).json({ message: 'No login account is linked to this employee. Please enable login first.' });
    }

    const passwordHash = await bcrypt.hash(newPassword.trim(), 10);
    await prisma.user.update({
      where: { id: employee.user.id },
      data: { passwordHash, status: 'ACTIVE' },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'UPDATE',
      entity: 'User',
      entityId: employee.user.id,
      details: `Reset password for employee ${employee.firstName} ${employee.lastName} [${employee.employeeCode}] (${employee.user.email})`,
    });

    return res.json({ message: `Password successfully updated for ${employee.user.email}.` });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// Update Employee Profile
router.put('/employees/:id', requirePermission('employees.manage'), async (req: Request, res: Response) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      departmentId,
      designation,
      roleId,
      shiftId,
      managerId,
      workLocation,
      basicSalary,
      allowances,
      deductions,
      status,
    } = req.body;

    const employee = await prisma.employee.findFirst({
      where: { id: req.params.id, organizationId: req.organizationId! },
      include: { user: true },
    });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const updated = await prisma.employee.update({
      where: { id: req.params.id },
      data: {
        firstName: firstName ? firstName.trim() : employee.firstName,
        lastName: lastName ? lastName.trim() : employee.lastName,
        phone,
        departmentId: departmentId || employee.departmentId,
        designation: designation || employee.designation,
        roleId: roleId !== undefined ? (roleId || null) : employee.roleId,
        shiftId: shiftId !== undefined ? (shiftId || null) : employee.shiftId,
        managerId: managerId !== undefined ? (managerId || null) : employee.managerId,
        workLocation: workLocation || employee.workLocation,
        basicSalary: basicSalary !== undefined ? Number(basicSalary) : employee.basicSalary,
        allowances: allowances !== undefined ? Number(allowances) : employee.allowances,
        deductions: deductions !== undefined ? Number(deductions) : employee.deductions,
        status: status || employee.status,
      },
      include: {
        department: true,
        role: true,
        shift: true,
        manager: true,
        user: {
          select: {
            id: true,
            email: true,
            status: true,
            roleId: true,
            role: { select: { id: true, name: true, description: true } },
            lastLoginAt: true,
          },
        },
      },
    });

    // Keep linked user synchronized if name or role updated
    if (employee.user) {
      const userUpdate: any = {};
      if (firstName) userUpdate.firstName = firstName.trim();
      if (lastName) userUpdate.lastName = lastName.trim();
      if (roleId) userUpdate.roleId = roleId;

      if (Object.keys(userUpdate).length > 0) {
        await prisma.user.update({
          where: { id: employee.user.id },
          data: userUpdate,
        });
      }
    }

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'UPDATE',
      entity: 'Employee',
      entityId: employee.id,
      details: `Updated employee profile for ${updated.firstName} ${updated.lastName} [${updated.employeeCode}]`,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// ATTENDANCE & SHIFTS
// ==========================================
router.get('/attendance', requirePermission(['attendance.view', 'my_attendance.view']), async (req: Request, res: Response) => {
  try {
    const { date } = req.query;
    const targetDate = String(date || new Date().toISOString().split('T')[0]);

    const where: any = { organizationId: req.organizationId!, date: targetDate };

    // If only my_attendance.view, scope strictly to self
    if (!req.user?.permissions.includes('attendance.view') && req.user?.role !== 'ADMIN') {
      if (req.user?.employeeId) {
        where.employeeId = req.user.employeeId;
      }
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: { include: { department: true, shift: true } },
        shift: true,
      },
      orderBy: { checkIn: 'asc' },
    });
    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/attendance/punch', async (req: Request, res: Response) => {
  try {
    const { employeeId, type } = req.body;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().slice(0, 5);

    const targetEmpId = employeeId || req.user!.employeeId;
    if (!targetEmpId) return res.status(400).json({ message: 'No employee ID provided' });

    // Enforce permission if punching for another employee
    if (targetEmpId !== req.user?.employeeId && !req.user?.permissions.includes('attendance.manage') && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: You can only punch your own attendance.' });
    }

    let record = await prisma.attendance.findFirst({
      where: { organizationId: req.organizationId!, employeeId: targetEmpId, date: today },
    });

    if (!record) {
      record = await prisma.attendance.create({
        data: {
          organizationId: req.organizationId!,
          employeeId: targetEmpId,
          date: today,
          checkIn: nowTime,
          status: 'PRESENT',
          workHours: 0,
        },
      });
    } else if (type === 'CHECK_OUT') {
      record = await prisma.attendance.update({
        where: { id: record.id },
        data: { checkOut: nowTime, workHours: 8.0 },
      });
    }

    return res.json(record);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// LEAVE MANAGEMENT
// ==========================================
router.get('/leaves', requirePermission(['leave.view', 'my_leave.view']), async (req: Request, res: Response) => {
  try {
    const where: any = { organizationId: req.organizationId! };

    // If only my_leave.view, scope to self
    if (!req.user?.permissions.includes('leave.view') && req.user?.role !== 'ADMIN') {
      if (req.user?.employeeId) {
        where.employeeId = req.user.employeeId;
      }
    }

    const leaves = await prisma.leaveRequest.findMany({
      where,
      include: {
        employee: { include: { department: true } },
        leaveType: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(leaves);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/leaves', async (req: Request, res: Response) => {
  try {
    const { employeeId, leaveTypeId, startDate, endDate, days, reason } = req.body;
    const targetEmpId = employeeId || req.user!.employeeId;

    if (!targetEmpId) return res.status(400).json({ message: 'Employee ID is required' });

    // Self check
    if (targetEmpId !== req.user?.employeeId && !req.user?.permissions.includes('leave.manage') && req.user?.role !== 'ADMIN') {
      return res.status(403).json({ message: 'Forbidden: You can only apply leave for yourself.' });
    }

    let resolvedLeaveTypeId = leaveTypeId;
    if (!resolvedLeaveTypeId || resolvedLeaveTypeId === 'default') {
      const defaultLt = await prisma.leaveType.findFirst({ where: { organizationId: req.organizationId! } });
      resolvedLeaveTypeId = defaultLt?.id;
    }

    const leave = await prisma.leaveRequest.create({
      data: {
        organizationId: req.organizationId!,
        employeeId: targetEmpId,
        leaveTypeId: resolvedLeaveTypeId,
        startDate,
        endDate,
        days: Number(days) || 1,
        reason,
        status: 'PENDING',
      },
      include: { employee: true, leaveType: true },
    });

    return res.status(201).json(leave);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/leaves/:id/approve', requirePermission('leave.manage'), async (req: Request, res: Response) => {
  try {
    const { status, comments } = req.body;
    const updated = await prisma.leaveRequest.update({
      where: { id: req.params.id },
      data: {
        status,
        comments,
        approvedById: req.user!.userId,
      },
      include: { employee: true, leaveType: true },
    });

    await recordAuditLog({
      organizationId: req.organizationId!,
      userId: req.user!.userId,
      userName: `${req.user!.firstName} ${req.user!.lastName}`,
      action: 'APPROVE',
      entity: 'LeaveRequest',
      entityId: updated.id,
      details: `${status} leave request for ${updated.employee.firstName} ${updated.employee.lastName} (${updated.days} days)`,
      newValue: status,
    });

    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// RECRUITMENT & CANDIDATES
// ==========================================
router.get('/recruitment', requirePermission('recruitment.view'), async (req: Request, res: Response) => {
  try {
    const jobs = await prisma.jobOpening.findMany({
      where: { organizationId: req.organizationId! },
      include: {
        department: true,
        candidates: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(jobs);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.post('/recruitment/openings', requirePermission('recruitment.manage'), async (req: Request, res: Response) => {
  try {
    const { title, departmentId, openings, experience, salaryRange, location, description } = req.body;
    const job = await prisma.jobOpening.create({
      data: {
        organizationId: req.organizationId!,
        title,
        departmentId,
        openings: Number(openings) || 1,
        experience,
        salaryRange,
        location: location || 'Headquarters',
        description,
        status: 'OPEN',
      },
      include: { department: true },
    });
    return res.status(201).json(job);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

router.patch('/recruitment/candidates/:id/stage', requirePermission('recruitment.manage'), async (req: Request, res: Response) => {
  try {
    const { stage } = req.body;
    const updated = await prisma.candidate.update({
      where: { id: req.params.id },
      data: { stage },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

// ==========================================
// PAYROLL
// ==========================================
router.get('/payroll', requirePermission(['payroll.view', 'my_payslips.view']), async (req: Request, res: Response) => {
  try {
    const where: any = { organizationId: req.organizationId! };

    // If only my_payslips.view, filter slips to self
    const slipWhere: any = {};
    if (!req.user?.permissions.includes('payroll.view') && req.user?.role !== 'ADMIN') {
      if (req.user?.employeeId) {
        slipWhere.employeeId = req.user.employeeId;
      }
    }

    const periods = await prisma.payrollPeriod.findMany({
      where,
      include: {
        slips: {
          where: slipWhere,
          include: { employee: { include: { department: true } } },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
    return res.json(periods);
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;
