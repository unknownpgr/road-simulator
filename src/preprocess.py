from genericpath import exists
import os
import cv2
import csv
from os.path import join, dirname
import shutil

SCALE_DOWN = 4
RAWDATA_ROOT = join(dirname(__file__), 'rawdata')
DATASET_ROOT = join(dirname(__file__), 'dataset')


def recursive_mkdir(dir_to_make):
    path_stack = []
    cur = dir_to_make
    while not exists(cur):
        path_stack.append(cur)
        cur = dirname(cur)
    path_stack = reversed(path_stack)

    for path in path_stack:
        os.mkdir(path)


def recursive_rmdir(dir_to_remove):
    try:
        shutil.rmtree(dir_to_remove)
    except Exception:
        pass


def mode_segmentation(dir_rawdata, dir_dataset):
    DIR_INPUT = 'input'
    DIR_LABEL = 'label'
    DIR_META = 'meta.csv'

    recursive_mkdir(join(dir_dataset, DIR_INPUT))
    recursive_mkdir(join(dir_dataset, DIR_LABEL))

    i = 1
    files = os.listdir(dir_rawdata)
    files_len = len(files)
    with open(join(dir_dataset, DIR_META), 'w', encoding='utf-8', newline='') as metadata:
        csv_meta = csv.writer(metadata)
        csv_meta.writerow(['input', 'label'])
        for f in files:
            full_path = join(dir_rawdata, f)
            print(i, '/', files_len)

            # Read image
            img = cv2.imread(full_path)

            # Convert color
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Resize image
            img = cv2.resize(img, (640//SCALE_DOWN, 480*2//SCALE_DOWN))

            # Split input and label
            data_input = img[:480//SCALE_DOWN, :]
            data_label = img[480//SCALE_DOWN:, :]

            # Get file name
            file_input = join(DIR_INPUT, str(i)+'.jpg')
            file_label = join(DIR_LABEL, str(i)+'.jpg')

            # Save images
            cv2.imwrite(join(dir_dataset, file_input), data_input)
            cv2.imwrite(join(dir_dataset, file_label), data_label)

            # Save metadata
            csv_meta.writerow([file_input, file_label])
            i += 1


def mode_regression(dir_rawdata, dir_dataset):
    DIR_INPUT = 'input'
    DIR_LABEL = 'label.csv'

    recursive_mkdir(join(dir_dataset, DIR_INPUT))

    i = 1
    files = os.listdir(dir_rawdata)
    files_len = len(files)
    with open(join(dir_dataset, DIR_LABEL), 'w', encoding='utf-8', newline='') as metadata:
        csv_label = csv.writer(metadata)
        csv_label.writerow(['input', 'position', 'angle'])
        for f in files:
            full_path = join(dir_rawdata, f)
            print(i, '/', files_len)

            # Read image
            img = cv2.imread(full_path)

            # Convert color
            img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Resize image
            img = cv2.resize(img, (640//SCALE_DOWN, 480*2//SCALE_DOWN))

            # Split input
            data_input = img[:480//SCALE_DOWN, :]

            # Get file name
            file_input = join(DIR_INPUT, str(i)+'.jpg')

            # Get label
            label = list(map(float, f[:-4].split('_')))

            # Save images
            cv2.imwrite(join(dir_dataset, file_input), data_input)

            # Save metadata
            csv_label.writerow([file_input]+label)
            i += 1


for subdir in os.listdir(RAWDATA_ROOT):
    print(subdir)
    rawdata_full_path = join(RAWDATA_ROOT, subdir)

    # Generate dataset for regression
    dataset_full_path = join(DATASET_ROOT, subdir+'_regression')
    recursive_rmdir(dataset_full_path)
    mode_regression(rawdata_full_path, dataset_full_path)

    # Generate dataset for pixel segmentation
    dataset_full_path = join(DATASET_ROOT, subdir+'_segementation')
    recursive_rmdir(dataset_full_path)
    mode_segmentation(rawdata_full_path, dataset_full_path)
