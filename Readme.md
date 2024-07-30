1. Run npm i(node >= 14.0)
2. make sure you have the postgres agent installed on your machine
3. make sure you have docker installed on your machine
4. make sure you have the correct .env content and file located in your root directoy
5. docker compose up -d (you should see that port 5432 of your local machine is forwarded to docker port 5432 and postgres instance is run on it)
6. npm run dev



P.S:

if you saw this error:
   return self.emit('error', new Error('The server does not support SSL connections'))
                                    ^
Error: The server does not support SSL connections

then comment out the ssl object in the DataSource.ts file.