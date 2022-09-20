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
    httpPort,
    metricName
}) => {
    const mtl = mqttMtl(mqttUrl);
    mqttAdvertise(mtl, (name, meta) => {
        if (!registers[name]) {
            log.info("New register", name);
            let reg = {
                labels: {
                    n: name,
                    ...name.split(".").map((k, i) => ({ k, i })).reduce((acc, { k, i }) => ({ [`n${i + 1}`]: k, ...acc }), {}),
                    ...Object.entries(meta).filter(([k, v]) => !(v instanceof Object)).reduce((acc, [k, v]) => ({ [k]: v, ...acc }), {})
                }
            };
            registers[name] = reg;
            mqttReg(mtl, name, (actual, prev, initial) => {
                if (!initial) {
                    reg.last = {
                        value: actual,
                        ts: new Date().getTime()
                    }
                }
            });
        }
    });

    const app = express()

    app.get('/metrics', (req, res) => {


        log.debug("Scrape request");

        res.set("Content-Type", "text/plain");

        res.write(`# HELP ${metricName} All registers\n`);
        res.write(`# TYPE ${metricName} gauge\n`);

        for (let name in registers) {
            let reg = registers[name];
            if (reg.last) {
                let value = reg.last.value;
                if (typeof value === "boolean") {
                    value = value ? 1 : 0;
                }

                if (isFinite(value)) {
                    let labels = Object.entries(reg.labels).map(([k, v]) => `${k}="${v}"`).join(",");
                    res.write(`${metricName}{${labels}} ${value} ${reg.last.ts}\n`);
                }
            }
        }

        res.end();
    })

    app.listen(httpPort, () => {
        log.info(`Metrics available at http://localhost:${httpPort}/metrics`);
    })

});

