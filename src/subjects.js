const subjects = [
  { id: 'math', name: 'Mathematics', description: 'Algebra, calculus, and geometry' },
  { id: 'science', name: 'Science', description: 'Physics, chemistry, and biology' },
  { id: 'history', name: 'History', description: 'World history and civics' },
  { id: 'literature', name: 'Literature', description: 'Reading and writing skills' },
];

function getSubject(id) {
  return subjects.find(s => s.id === id);
}

function listSubjects() {
  return subjects.map(s => ({ id: s.id, name: s.name }));
}

module.exports = { subjects, getSubject, listSubjects };
