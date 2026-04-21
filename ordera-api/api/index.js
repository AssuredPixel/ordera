"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("../src/app.module");
const validation_pipe_1 = require("../src/common/pipes/validation.pipe");
const platform_express_1 = require("@nestjs/platform-express");
const express_1 = require("express");
const cookie_parser_1 = require("cookie-parser");
let cachedApp;
const bootstrap = async () => {
    if (!cachedApp) {
        const expressApp = (0, express_1.default)();
        const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), {
            rawBody: true,
        });
        app.setGlobalPrefix('api');
        app.useGlobalPipes(new validation_pipe_1.ValidationPipe());
        app.use((0, cookie_parser_1.default)());
        app.enableCors({
            origin: process.env.FRONTEND_URL || '*',
            credentials: true,
        });
        await app.init();
        cachedApp = expressApp;
    }
    return cachedApp;
};
exports.default = async (req, res) => {
    const app = await bootstrap();
    return app(req, res);
};
//# sourceMappingURL=index.js.map