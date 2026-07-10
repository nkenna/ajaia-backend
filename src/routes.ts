import type { Application } from 'express';
import authRouter from './modules/auth/auth.routes';
import projectRouter from './modules/project/project.routes';
import documentRouter from './modules/document/document.routes';
import userRouter from './modules/user/user.routes';

class AppRoutes {
    init(app: Application): void {
        app.use('/api/v1/auth', authRouter);
        app.use('/api/v1/projects', projectRouter);
        app.use('/api/v1/documents', documentRouter);
        app.use('/api/v1/users', userRouter);
    }
}
export default new AppRoutes();