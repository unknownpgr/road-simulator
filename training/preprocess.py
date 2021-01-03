import os
import cv2
import numpy as np

reduce = 4


def pr1(dir):
    i = 1
    files = os.listdir(dir)
    files_len = len(files)
    for f in files:
        full_path = os.path.join(dir, f)
        print(i, '/', files_len)
        # Read image
        img = cv2.imread(full_path)
        # Convert color
        img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Resize image
        img = cv2.resize(img, (640//reduce, 480*2//reduce))
        # Convert image to array
        data_input = img[:480//reduce, :]
        cv2.imwrite('./pr1/inputs/'+str(i)+'.jpg', data_input)
        # Convert image to array
        data_label = img[480//reduce:, :]
        cv2.imwrite('./pr1/labels/'+str(i)+'.jpg', data_label)
        i += 1


root = '../dataset'
for dir in os.listdir(root):
    pr1(os.path.join(root, dir))
