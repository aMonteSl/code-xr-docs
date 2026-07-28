#!/usr/bin/env python3
"""
Script para optimizar la imagen de perfil para web
Genera múltiples tamaños optimizados desde la imagen original de alta resolución
"""

from PIL import Image
import os

def optimize_profile_image():
    # Ruta de la imagen original
    original_path = "public/profile/adrian-montes-linares.jpg"
    
    if not os.path.exists(original_path):
        print(f"❌ No se encontró la imagen en: {original_path}")
        print("Por favor, asegúrate de que la imagen esté en la carpeta public/profile/")
        return
    
    try:
        # Abrir la imagen original
        print("📸 Abriendo imagen original...")
        img = Image.open(original_path)
        print(f"   Tamaño original: {img.size[0]}x{img.size[1]} píxeles")
        
        # Tamaños que necesitamos para web
        sizes = [
            (256, 256, "small"),    # Para mobile
            (512, 512, "medium"),   # Para desktop normal
            (1024, 1024, "large")   # Para pantallas de alta densidad
        ]
        
        for width, height, suffix in sizes:
            print(f"🔄 Generando versión {suffix} ({width}x{height})...")
            
            # Crear una versión cuadrada centrada
            # Primero, hacer la imagen cuadrada croppeando desde el centro
            min_side = min(img.size)
            left = (img.size[0] - min_side) // 2
            top = (img.size[1] - min_side) // 4  # Un poco más arriba para enfocar la cara
            right = left + min_side
            bottom = top + min_side
            
            # Crop al cuadrado
            img_square = img.crop((left, top, right, bottom))
            
            # Redimensionar con alta calidad
            img_resized = img_square.resize((width, height), Image.Resampling.LANCZOS)
            
            # Aplicar un ligero sharpening
            from PIL import ImageEnhance
            enhancer = ImageEnhance.Sharpness(img_resized)
            img_enhanced = enhancer.enhance(1.1)
            
            # Guardar la imagen optimizada
            output_path = f"public/profile/adrian-montes-linares-{suffix}.jpg"
            img_enhanced.save(
                output_path, 
                "JPEG", 
                quality=95,  # Alta calidad
                optimize=True,
                progressive=True  # Carga progresiva
            )
            
            # Mostrar información del archivo
            file_size = os.path.getsize(output_path) / 1024  # KB
            print(f"   ✅ Guardado: {output_path} ({file_size:.1f} KB)")
        
        print("\n🎉 ¡Optimización completada!")
        print("\n📝 Ahora puedes usar estas versiones optimizadas:")
        print("   - adrian-montes-linares-small.jpg (256x256) - Para móviles")
        print("   - adrian-montes-linares-medium.jpg (512x512) - Para desktop")
        print("   - adrian-montes-linares-large.jpg (1024x1024) - Para pantallas HD")
        print("\n💡 Recomendación: Usa la versión 'medium' para el sitio web")
        
    except Exception as e:
        print(f"❌ Error al procesar la imagen: {str(e)}")
        print("Asegúrate de tener Pillow instalado: pip install Pillow")

if __name__ == "__main__":
    optimize_profile_image()
