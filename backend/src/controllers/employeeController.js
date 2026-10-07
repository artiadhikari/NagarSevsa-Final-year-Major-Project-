const Employee = require("../models/Employee");

// GET /api/employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const { department, role, zone } = req.query;
    const filter = { active: true };

    if (department) filter.department = department;
    if (role) filter.role = role;
    if (zone) filter.zone = zone;

    const employees = await Employee.find(filter).sort({ name: 1 });
    res.json(employees);
  } catch (err) {
    next(err);
  }
};

// GET /api/employees/:id
exports.getEmployeeById = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }
    res.json(employee);
  } catch (err) {
    next(err);
  }
};
