# Files
**Author**: Erfan

This fastify plugin is for simple file upload and download functionalities. it'll register two `POST /` and `GET /:id` routes.

## Goals
- create two routes to download and upload files
- validate input file type based plugin options (pdf, images)

## Not in Goals
- **manage s3 connection:** s3 connection should be passed through plugin options. this plugin should not create a new s3 connection for the user.
- **access controll:** access controlling should be done by providing fastify hooks to the plugin. this plugin should not know anything about you authorization system.
- image compression, creating thumbnails and other image proceeding
- **work with multiple s3 buckets:** you can register this plugin multiple times for each of your buckets.
- **provide too much control to the http client:** client should not able to control the response image. (e.g. set the image width dynamically). this can be used for DOS attacks. also makes caching not effective
