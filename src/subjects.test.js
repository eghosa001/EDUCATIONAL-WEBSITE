const { getSubject, listSubjects } = require('./subjects');

describe('Subject module', () => {
  test('listSubjects returns an array', () => {
    expect(Array.isArray(listSubjects())).toBe(true);
  });

  test('listSubjects returns all four subjects', () => {
    expect(listSubjects().length).toBe(4);
  });

  test('getSubject returns the correct subject for a valid id', () => {
    const subject = getSubject('math');
    expect(subject.name).toBe('Mathematics');
  });

  test('getSubject returns undefined for an invalid id', () => {
    expect(getSubject('nonexistent')).toBeUndefined();
  });
});
