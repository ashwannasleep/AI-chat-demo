import '@testing-library/jest-dom';

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {};

if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (callback) => setTimeout(callback, 0);
}

if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id) => clearTimeout(id);
}
