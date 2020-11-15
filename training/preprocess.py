import os
import cv2
import csv
import numpy as np


def load_data(dir):
    rows = []
    for f in os.listdir(dir):
        full_path = os.path.join(dir, f)
        # Split file name into labels
        pos, angle = f[:-4].split('_')
        print(pos, angle)
        # Read image
        img = cv2.imread(full_path)
        # Convert color
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Resize image
        img = cv2.resize(img, (640//16, 480//16))
        # Convert image to array
        img = list(np.reshape(img, [-1]))
        # Add to row
        rows.append([pos, angle]+img)
    return rows


with open("./data/dataset.csv", 'w', encoding='utf-8', newline='') as f:
    w = csv.writer(f)
    root = '../dataset'
    for dir in os.listdir(root):
        rows = load_data(os.path.join(root, dir))
        w.writerows(rows)
