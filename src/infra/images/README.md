# Images
**Author**: Erfan

If you want to deliver compressed and cropped images to the users, this plugin is for you
This fastify plugin uses [imgproxy](https://github.com/imgproxy/imgproxy) to modify images at `time-of-use`.

## Goals
- single GET route to download the image. then user can modify the result image based on querystring options.
- **provide useful defaults:** user should be able to use this plugin without need to pass too much options.

## Not in Goals
- **upload image** this plugin is for read operations only.
- **manage s3 connection:** s3 connection should be passed through plugin options. this plugin should not create a new s3 connection for the user.
- **access controll:** access controlling should be done by providing fastify hooks to the plugin. this plugin should not know anything about you authorization system.
- image compression, creating thumbnails and other image proceeding
- **work with s3 bucket:** `imgproxy` container is already registered to the s3 by DevOps engineers. it's not this plugin responsibility to provide `imgproxy` the raw image data.
- **caching:** images are already cached by `imgproxy` so we don't need to do it again.