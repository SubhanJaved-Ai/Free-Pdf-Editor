import sys
import os

filepath = 'public/pdf.worker.min.mjs'
content = open(filepath, 'r', encoding='utf-8').read()

if 'Array.from(this).map' not in content:
    polyfill = 'if(typeof Uint8Array !== "undefined" && !Uint8Array.prototype.toHex) { Uint8Array.prototype.toHex = function() { return Array.from(this).map(b => b.toString(16).padStart(2, "0")).join(""); }; };\n'
    open(filepath, 'w', encoding='utf-8').write(polyfill + content)
    print("Worker patched successfully")
else:
    print("Already patched")
