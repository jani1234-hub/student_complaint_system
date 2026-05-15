// Users database (in-memory)
const users = {
  'admin': { password: 'admin123', role: 'admin', name: 'Administrator' },
  'student1': { password: 'student123', role: 'student', name: 'John Doe' },
  'teacher': { password: 'teacher123', role: 'teacher', name: 'Prof. Smith' }
};

// In your login logic:
const user = users[username];
if (user && password === user.password) {
  const token = generateToken();
  res.json({
    success: true,
    token,
    message: 'Login successful',
    user: { username, role: user.role, name: user.name }
  });
} else {
  res.status(401).json({
    success: false,
    message: 'Incorrect username or password. Please try again.'
  });
}