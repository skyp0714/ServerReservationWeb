# Contributing to Server Reservation Web Application

Thank you for considering contributing to this project! Here are some guidelines to help you get started.

## How to Contribute

### Reporting Bugs

If you find a bug, please create an issue with:
- A clear, descriptive title
- Steps to reproduce the issue
- Expected vs actual behavior
- Screenshots if applicable
- Your environment (browser, OS, etc.)

### Suggesting Features

Feature suggestions are welcome! Please:
- Check existing issues first to avoid duplicates
- Provide a clear use case
- Explain how it would benefit users
- Include mockups or examples if possible

### Code Contributions

1. **Fork the repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ServerReservationWeb.git
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm run serve
   ```
   - Test in both light and dark modes
   - Verify responsiveness on different screen sizes
   - Check all user roles (Guest, Normal User, Admin)

5. **Commit your changes**
   ```bash
   git commit -m "Add: Brief description of your changes"
   ```

   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for updates to existing features
   - `Refactor:` for code refactoring
   - `Docs:` for documentation changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear description of changes
   - Reference any related issues
   - Include screenshots for UI changes

## Code Style Guidelines

### Vue Components

- Use Composition API where possible
- Keep components focused and single-purpose
- Use meaningful component and variable names
- Add JSDoc comments for complex functions

### CSS

- Follow the existing dark mode pattern
- Use CSS variables for colors when applicable
- Maintain responsive design
- Organize styles by component

### JavaScript

- Use ES6+ features
- Prefer `const` over `let`, avoid `var`
- Use async/await for asynchronous operations
- Handle errors gracefully

## Project Structure

When adding new features:
- Place Vue components in `src/views/` for pages or `src/components/` for reusable components
- Add CSS in `src/assets/styles/components/`
- Use existing utility functions from `src/utils/`
- Update router in `src/router/index.js` if needed

## Testing Checklist

Before submitting a PR, verify:
- [ ] Code runs without errors
- [ ] Light mode works correctly
- [ ] Dark mode works correctly
- [ ] Responsive on mobile, tablet, and desktop
- [ ] No console errors or warnings
- [ ] Firebase operations work as expected
- [ ] User permissions are respected

## Questions?

If you have questions, feel free to:
- Open an issue for discussion
- Comment on existing issues
- Reach out to maintainers

Thank you for contributing! 🎉
