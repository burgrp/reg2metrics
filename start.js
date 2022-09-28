const log = {
    error: require("debug")("app:error"),
    info: require("debug")("app:info"),
    debug: require("debug")("app:debug")
};

const mqttMtl = require("@burgrp/mqtt-mtl");
const { mqttReg, mqttAdvertise } = require("@burgrp/mqtt-reg");
const express = require("express");

let registers = {};

require("@burgrp/appglue")({ require, file: __dirname + "/config.json" }).main(({
    mqttUrl,
    httpPort
}) => {
    const mtl = mqttMtl(mqttUrl);
    mqttAdvertise(mtl, (name, meta) => {
        if (!registers[name]) {
            log.info("New register", name);
            let reg = {
                metric: name.replace(/\./g, ":").replace(/[^a-zA-Z0-9:]/g, "_"),
                labels: {
                    ...name.split(".").map((k, i) => ({ k, i })).reduce((acc, { k, i }) => ({ [`n${i + 1}`]: k, ...acc }), {}),
                    ...Object.entries(meta).filter(([k, v]) => !(v instanceof Object)).reduce((acc, [k, v]) => ({ [k]: v, ...acc }), {})
                }
            };
            registers[name] = reg;
            mqttReg(mtl, name, (actual, prev, initial) => {
                if (!initial) {
                    reg.value=actual;
                }
            });
        }
    });

    const app = express()

    app.get('/', (req, res) => {


        log.debug("Scrape request");

        res.set("Content-Type", "text/plain");

        for (let name in registers) {
            let reg = registers[name];
            let value = reg.value;
            if (value !== undefined) {
                if (typeof value === "boolean") {
                    value = value ? 1 : 0;
                }

                if (Number.isFinite(value)) {
                    let labels = Object.entries(reg.labels).map(([k, v]) => `${k}="${v}"`).join(",");
                    res.write(`# TYPE ${reg.metric} gauge\n`);
                    res.write(`${reg.metric}{${labels}} ${value}\n`); // ${new Date().getTime()}
                }
            }
        }

        res.end();
    })

    app.listen(httpPort, () => {
        log.info(`Metrics available at http://localhost:${httpPort}/metrics`);
    })

});

