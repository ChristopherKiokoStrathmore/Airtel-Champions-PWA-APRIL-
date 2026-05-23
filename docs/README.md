# Airtel Champions App Web - Technical Documentation

## Overview

Airtel Champions App Web is a Progressive Web Application (PWA) built with React 18, TypeScript, and Vite. It serves as a comprehensive sales team management platform for Airtel, featuring role-based dashboards, gamification, real-time tracking, and extensive functionality.

## Architecture

### Technology Stack
- **Frontend**: React 18.3.1 with TypeScript
- **Build Tool**: Vite 6.3.5
- **Styling**: TailwindCSS v4 with custom components
- **UI Components**: Radix UI component library
- **State Management**: Zustand
- **Backend**: Supabase (PostgreSQL + Real-time)
- **Mobile**: Capacitor for PWA capabilities

### Project Structure
```
src/
├── components/          # React components
│   ├── app/            # Main app components
│   ├── ui/             # Reusable UI components
│   ├── programs/       # Program management
│   ├── hbb/            # HBB-specific components
│   └── calling/        # WebRTC calling system
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── utils/              # Helper functions
├── supabase/           # Supabase functions
└── types/              # TypeScript type definitions
```

## Key Features

### Authentication & Authorization
- Multi-mode login (Sales/HBB)
- Phone number + PIN authentication
- Role-based access control
- Session tracking and analytics

### Role-Based Dashboards
- Sales Executive
- Zone Sales Manager (ZSM)
- Zone Business Manager
- HQ Command Center
- Director
- HBB Agent/Installer

### Core Business Features
- **Programs Management**: Dynamic program creation and submission
- **VAN Calendar**: Vehicle activity scheduling
- **Social Feed**: Internal social networking
- **Gamification**: Points, badges, leaderboards
- **Analytics Dashboard**: Performance metrics
- **Real-time Location Tracking**: GPS integration

### Advanced Features
- **WebRTC Calling System**: Peer-to-peer communication
- **Camera Integration**: Photo capture and upload
- **Offline Support**: PWA capabilities
- **Push Notifications**: Real-time updates
- **Theme System**: Dark/light mode support

## Development Guidelines

### Code Standards
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture
- Custom hooks for reusable logic

### Testing
- Jest for unit testing
- React Testing Library for component testing
- Coverage reports with Jest
- Test-driven development encouraged

### Security
- Environment variables for sensitive data
- Row-level security (RLS) policies
- Input validation and sanitization
- Secure authentication flows

## Deployment

### Environment Setup
1. Copy `.env.example` to `.env`
2. Fill in environment variables
3. Install dependencies: `npm install`
4. Start development: `npm run dev`

### Build Process
1. Build for production: `npm run build`
2. Test coverage: `npm run test:coverage`
3. Deploy to hosting platform

## Performance Optimization

### Bundle Optimization
- Code splitting with dynamic imports
- Lazy loading of components
- Tree shaking for unused code
- Image optimization

### Runtime Performance
- Memoization with React.memo
- Debouncing for search/filter operations
- Virtual scrolling for large lists
- Service worker for caching

## Monitoring & Analytics

### Performance Monitoring
- Web Vitals tracking
- Error boundary logging
- Network request monitoring
- User interaction analytics

### Business Analytics
- User engagement tracking
- Feature usage statistics
- Conversion funnel analysis
- Performance metrics

## Contributing

### Development Workflow
1. Create feature branch from `main`
2. Implement changes with tests
3. Ensure all tests pass
4. Update documentation
5. Submit pull request

### Code Review Process
- Automated testing
- Code quality checks
- Security review
- Performance impact assessment

## Support

### Troubleshooting
- Check console for errors
- Verify environment variables
- Test with different user roles
- Check network connectivity

### Common Issues
- Authentication failures
- Database connection errors
- Performance bottlenecks
- Mobile compatibility issues

For detailed technical documentation, see the specific sections in this documentation folder.
