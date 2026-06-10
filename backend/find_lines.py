import cv2
import numpy as np

img = cv2.imread('page0.png', 0)
# Threshold the image
_, thresh = cv2.threshold(img, 200, 255, cv2.THRESH_BINARY_INV)

# Find horizontal lines
# The menu is full width, so horizontal lines will be very wide
kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (100, 1))
horizontal_lines = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)

# Get the Y coordinates of the lines
contours, _ = cv2.findContours(horizontal_lines, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
y_coords = []
for c in contours:
    x, y, w, h = cv2.boundingRect(c)
    if w > 200:  # Only consider long lines
        y_coords.append(y + h//2)

y_coords.sort()
print("Horizontal lines found at Y:")
print(y_coords)
