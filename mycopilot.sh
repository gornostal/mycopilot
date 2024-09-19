#!/usr/bin/bash

# cd to the directory of the current file

cd "$(dirname "$0")"

exec node --experimental-strip-types index.ts $@