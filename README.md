# reg2metrics
Register to Prometheus metrics provider


Build the image
```shell
docker run --rm --privileged docker/binfmt:820fdd95a9972a5308930a2bdfb8573dd4447ad3
docker buildx build --push --platform linux/arm/v7 . -t burgrp/reg2metrics
```
