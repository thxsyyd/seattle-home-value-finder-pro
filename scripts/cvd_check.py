"""Colour-vision-deficiency check for the map palettes.

Simulates protanopia, deuteranopia and tritanopia (Machado et al. 2009, severity 1.0, applied in linear sRGB) and
reports the CIE76 colour difference (Delta E) between neighbouring classes. Neighbours below about 10 are hard to tell
apart for the affected viewers; the map therefore never relies on colour alone (labels, arrows and numbers repeat it).

Run: pipeline/.venv/bin/python scripts/cvd_check.py
"""
import numpy as np

PAL = {
    "deviation (RdBu)": ["#2166ac", "#67a9cf", "#b0d0e6", "#efefef", "#f9cdb1", "#ef8a62", "#b2182b"],
    "area layer (grey lightness)": ["#eeeeee", "#cfcfcf", "#b0b0b0", "#939393", "#777777", "#5c5c5c", "#404040"],
}
M = {
    "normal": np.eye(3),
    "protanopia": np.array([[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]]),
    "deuteranopia": np.array([[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.011820, 0.042940, 0.968881]]),
    "tritanopia": np.array([[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.303900]]),
}


def hex_rgb(h):
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)]) / 255


def to_lin(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def to_lab(lin):
    xyz = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]]) @ lin
    xyz = xyz / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.array([116 * f[1] - 16, 500 * (f[0] - f[1]), 200 * (f[1] - f[2])])


for name, cols in PAL.items():
    print(name)
    for sim, mat in M.items():
        labs = [to_lab(np.clip(mat @ to_lin(hex_rgb(c)), 0, 1)) for c in cols]
        d = [float(np.linalg.norm(labs[i] - labs[i + 1])) for i in range(len(cols) - 1)]
        print(f"  {sim:13s} min {min(d):5.1f}  neighbours: " + " ".join(f"{x:5.1f}" for x in d))
