import sys,os
import numpy as np
from scipy import ndimage
from PIL import Image
src,dst=sys.argv[1],sys.argv[2];os.makedirs(dst,exist_ok=True)
# file -> (name, rotate_deg_ccw, white_backing)
M={
 'p1_0_00.png':('logo-app',0,True),
 'p1_0_01.png':('sticker-senara-guitar',0,True),
 'p1_0_02.png':('treble-clef-wide',0,True),
 'p1_0_03.png':('note-beamed-xs',0,True),
 'p2_1_00.png':('sticker-senara-acoustic',0,True),
 'p2_1_01.png':('sparkle-1',0,True),
 'p2_1_02.png':('sticker-senara-soundhole',0,True),
 'p2_1_03.png':('treble-clef-wide-2',0,True),
 'p3_2_00.png':('note-beamed-lg',0,True),
 'p3_2_01.png':('sparkle-2',0,True),
 'p3_2_02.png':('treble-clef',0,True),
 'p3_2_03.png':('sparkle-3',0,True),
 'p3_2_04.png':('note-beamed-sm',0,True),
 'p4_3_00.png':('bubble-looking-for',0,True),
 'p4_3_01.png':('sparkle-tall',0,True),
 'p4_3_02.png':('bubble-10-percent',0,True),
 'p4_3_03.png':('bubble-careful',0,True),
 'p4_4_00.png':('letter-s',-90,False),
 'p4_4_01.png':('letter-e',-90,False),
 'p5_5_00.png':('letter-a',-90,False),
 'p5_5_01.png':('letter-r',-90,False),
 'p5_5_02.png':('letter-a-2',-90,False),
 'p5_5_03.png':('letter-n',-90,False),
}
for f,(name,rot,white) in M.items():
  im=Image.open(os.path.join(src,f)).convert('RGBA')
  if white:
    a=np.array(im)
    inside=ndimage.binary_fill_holes(a[...,3]>8)
    base=np.zeros_like(a);base[inside]=(255,255,255,255)
    b=Image.fromarray(base,'RGBA');b.alpha_composite(im);im=b
  if rot: im=im.rotate(rot,expand=True)
  im.save(os.path.join(dst,name+'.png'),optimize=True)
  # web-size version for UI/canvas (max 1200px)
  w=im.copy();w.thumbnail((1200,1200),Image.LANCZOS);w.save(os.path.join(dst,name+'.webp'),quality=90,method=6)
  print(name,im.size)
