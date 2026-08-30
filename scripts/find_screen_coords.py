from PIL import Image
import numpy as np

img = Image.open("/Users/bl10buer/.gemini/antigravity-ide/brain/1810b937-8dbf-40f1-bb66-5c99ba04a3ad/mindcast_creator_epiphany_1787963858930.jpg")
w, h = img.size

# Screen coordinates approximately:
# Top-left: ~ (385, 385)
# Top-right: ~ (585, 385)
# Bottom-left: ~ (425, 575)
# Bottom-right: ~ (625, 545)
# Let's crop x in [350, 650], y in [350, 600] and check:
crop = img.crop((370, 370, 640, 580))
crop.save("/tmp/mindcast_screen_crop.png")
print("Cropped screen area successfully.")
