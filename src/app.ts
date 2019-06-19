import dotenv    from 'dotenv';
import path from 'path';
dotenv.config({path: path.resolve(__dirname,'..','.env')});
import Server  from './server';
const server = Server.instance;
console.log(path.resolve(__dirname,'..','.env'));

server.basicMiddlewares();
server.registerRouter();

server.dbCore.connect(server.logger,() => {
        server.start((port: number) => {

                server.logger.info(`The API is already running, on the ${port}`, {port});
        })
});
