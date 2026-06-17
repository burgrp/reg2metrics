# reg2metrics
MQTT-register to Prometheus metrics provider

See MQTT-register specification at https://github.com/burgrp/mqtt-reg.

Build the image

Raspberry Pi:
```shell
docker run --rm --privileged docker/binfmt:820fdd95a9972a5308930a2bdfb8573dd4447ad3
docker buildx build --push --platform linux/arm/v7 . -t burgrp/reg2metrics
```

x86_64:
```shell
docker build --push . -t burgrp/reg2metrics:v1.0.0
```