// public/js/scripts.js
document.addEventListener('DOMContentLoaded', function() {
    console.log('scripts.js arrancó. Datos:', window._datos);
    if (!window._datos || !window._datos.genero) {
      console.error('No hay datos para graficar.');
      return;
    }
    
    const { genero, gradoAcademico, puesto, antiguedad } = window._datos;
    const colores = {
      genero: ['#4e73df','#e74a3b','#1cc88a'],
      grado: ['#f6c23e','#36b9cc','#1cc88a','#4e73df'],
      puesto: ['#e74a3b','#4e73df','#1cc88a'],
      antiguedad: ['#36b9cc','#1cc88a','#f6c23e','#e74a3b']
    };
    
    // leyenda
    const configComun = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          position: 'bottom', 
          labels: { 
            padding: 20, 
            font: { size: 12 },
            // Porcentaje
            generateLabels: function(chart) {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const dataset = data.datasets[0];
                const total = dataset.data.reduce((acc, value) => acc + value, 0);
                
                return data.labels.map((label, i) => {
                  const value = dataset.data[i];
                  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                  
                  return {
                    text: `${label}: ${percentage}%`,
                    fillStyle: dataset.backgroundColor[i],
                    hidden: !chart.getDataVisibility(i),
                    index: i,
                    strokeStyle: '#fff',
                    lineWidth: 2
                  };
                });
              }
              return [];
            }
          }
        },
        tooltip: {
          callbacks: {
            label(ctx) {
              const v = ctx.raw || 0;
              const t = ctx.chart.data.datasets[0].data.reduce((a,b)=>a+b,0);
              return `${ctx.label}: ${v} (${Math.round(v/t*100)}%)`;
            }
          }
        }
      }
    };
    
    function creaPie(id, datos, paleta) {
      const c = document.getElementById(id);
      if (!c) return console.warn(`Canvas ${id} no existe`);
      
      new Chart(c, {
        type: 'pie',
        data: { 
          labels: datos.labels, 
          datasets:[{ 
            data: datos.valores, 
            backgroundColor: paleta 
          }] 
        },
        options: configComun
      });
    }
    
    creaPie('generoChart', genero, colores.genero);
    creaPie('gradoChart', gradoAcademico, colores.grado);
    creaPie('puestoChart', puesto, colores.puesto);
    creaPie('antiguedadChart', antiguedad, colores.antiguedad);
  });