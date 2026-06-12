import io
import random
from PIL import Image, ImageDraw, ImageFont
from django.core.files.base import ContentFile

COLORS = [
    (79, 70, 229),   # #4F46E5
    (14, 165, 233),  # #0EA5E9
    (16, 185, 129),  # #10B981
    (245, 158, 11),  # #F59E0B
    (239, 68, 68),   # #EF4444
    (139, 92, 246),  # #8B5CF6
]

def generate_avatar(first_name: str) -> ContentFile:
    letter = first_name[0].upper() if first_name else "U"
    color = random.choice(COLORS)
    
    # Create a 200x200 image
    img = Image.new("RGB", (200, 200), color=color)
    draw = ImageDraw.Draw(img)
    
    # Try to load a font
    font = None
    font_paths = [
        "/System/Library/Fonts/Helvetica.ttc",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in font_paths:
        try:
            font = ImageFont.truetype(path, 120)
            break
        except IOError:
            continue
            
    if font is None:
        font = ImageFont.load_default()

    # Get text size
    try:
        # Pillow 10+
        left, top, right, bottom = draw.textbbox((0, 0), letter, font=font)
        text_w = right - left
        text_h = bottom - top
    except AttributeError:
        # Older Pillow
        text_w, text_h = draw.textsize(letter, font=font)
        left = top = 0

    x = (200 - text_w) / 2 - left
    y = (200 - text_h) / 2 - top
    
    draw.text((x, y), letter, fill=(255, 255, 255), font=font)
    
    fp = io.BytesIO()
    img.save(fp, format="PNG")
    fp.seek(0)
    
    return ContentFile(fp.read(), name=f"avatar_{letter}.png")
