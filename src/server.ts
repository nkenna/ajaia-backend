import app from './app';
import config from '../src/config/config';

const server = app.listen(config.port, '0.0.0.0', () => {
    // tslint:disable-next-line:no-console
    console.log(`Server running on port ${config.port}`);
});



export default app;