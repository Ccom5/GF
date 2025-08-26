// JavaScript para manejar el índice lateral
document.addEventListener('DOMContentLoaded', function() {
    // Seleccionar todos los enlaces del índice lateral
    const enlacesIndice = document.querySelectorAll('.book-sidebar ul li a');
    
    // Función para manejar los clics
    enlacesIndice.forEach(function(enlace) {
        enlace.addEventListener('click', function(e) {
            // Remover la clase 'activo' de todos los enlaces
            enlacesIndice.forEach(function(otroEnlace) {
                otroEnlace.classList.remove('activo');
            });
            
            // Agregar la clase 'activo' al enlace clickeado
            this.classList.add('activo');
        });
    });
    
    // Ya NO marcamos automáticamente ningún capítulo al cargar
    // Los efectos solo aparecen al pasar el mouse o hacer clic
});
