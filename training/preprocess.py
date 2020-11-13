import os
import cv2

raw_dir = '../dataset/imgs'
for f in os.listdir(raw_dir):
    full_path = raw_dir+'/'+f
    print(f)
    # Read image
    img = cv2.imread(full_path)
    # Resize image
    img = cv2.resize(img, (120, 90))
    # Cut image half (=RoI)
    img = img[60:, :]
    # Save
    cv2.imwrite('data/'+f, img)
