let mobilenet;
let model;
const webcam = new Webcam(document.getElementById('wc'));
const dataset = new RPSDataset();
var zoominSamples=0, zoomoutSamples=0, nextpageSamples=0, previouspageSamples=0;
let isPredicting = false;
let pdf;
let canvas;
let isPageRendering;
let pageRenderingQueue = null;
let canvasContext;
let totalPages;
let currentPageNum = 1;
let zoom = 1;


async function loadMobilenet() {
  const mobilenet = await tf.loadLayersModel('https://storage.googleapis.com/tfjs-models/tfjs/mobilenet_v1_1.0_224/model.json');
  const layer = mobilenet.getLayer('conv_pw_13_relu');
  return tf.model({inputs: mobilenet.inputs, outputs: layer.output});
}

async function train() {
  dataset.ys = null;
  dataset.encodeLabels(4);
    
  model = tf.sequential({
    layers: [
        
        tf.layers.flatten({inputShape: mobilenet.outputs[0].shape.slice(1)}),
        tf.layers.dense({ units: 100, activation: 'relu'}),
        tf.layers.dense({ units: 4, activation: 'softmax'})
    ]
  });
    
  const optimizer = tf.train.adam(0.0001);
    
  model.compile({optimizer: optimizer, loss: 'categoricalCrossentropy'});
 
  let loss = 0;
  model.fit(dataset.xs, dataset.ys, {
    epochs: 10,
    callbacks: {
      onBatchEnd: async (batch, logs) => {
        loss = logs.loss.toFixed(6);
        console.log('LOSS: ' + loss);
        }
      }
   });
}


function handleButton(elem){
	switch(elem.id){
		case "0":
			zoominSamples++;
			document.getElementById("zoominsamples").innerText = "Zoomin samples:" + zoominSamples;
			break;
		case "1":
			zoomoutSamples++;
			document.getElementById("zoomoutsamples").innerText = "Zoomout samples:" + zoomoutSamples;
			break;
		case "2":
			nextpageSamples++;
			document.getElementById("nextpagesamples").innerText = "Nextpage samples:" + nextpageSamples;
			break;  
		case "3":
			previouspageSamples++;
			document.getElementById("previouspagesamples").innerText = "Previouspage samples:" + previouspageSamples;
			break; 
	}
	label = parseInt(elem.id);
	const img = webcam.capture();
	dataset.addExample(mobilenet.predict(img), label);

}

async function predict() {
  while (isPredicting) {
    const predictedClass = tf.tidy(() => {
      const img = webcam.capture();
      const activation = mobilenet.predict(img);
      const predictions = model.predict(activation);
      return predictions.as1D().argMax();
    });
    const classId = (await predictedClass.data())[0];
      var predictiontext = ""
    switch(classId){
		case 0:
            predictiontext = "zoomin"
			zoomin();
			break;
		case 1:
            predictiontext = "zoomout"
            zoomout();
			break;
		case 2:
            predictiontext = "nextpage"
			renderNextPage();
			break;
		case 3:
            predictiontext = "previouspage"
			renderPreviousPage();
			break;
            
	}
	
	document.getElementById("prediction").innerText = predictiontext;		
    
    predictedClass.dispose();
    await tf.nextFrame();
  }
}


function doTraining(){
	train();
	alert("Training Done!")
}

function startPredicting(){
	isPredicting = true;
	predict();
}

function stopPredicting(){
	isPredicting = false;
	predict();
}


function saveModel(){
    model.save('downloads://my_model');
}


async function init(){
	await webcam.setup();
	mobilenet = await loadMobilenet();
	window.addEventListener('load', function () {
    isPageRendering= false;
    pageRenderingQueue = null;
    canvas = document.getElementById('pdf_canvas');
    canvasContext = canvas.getContext('2d');
    Renderer(); 
    });
    tf.tidy(() => mobilenet.predict(webcam.capture()));    

}


 async function Renderer() {
            var pdfjsLib = window['pdfjs-dist/build/pdf'];
            pdfjsLib.GlobalWorkerOptions.workerSrc = '//mozilla.github.io/pdf.js/build/pdf.worker.js';
            const url = 'DCN end term 2018.pdf';
            let option  = {url};
            pdfDoc.getPage(num).then(function(page) {
    var viewport = page.getViewport({scale: zoom});
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    // Render PDF page into canvas context
    var renderContext = {
      canvasContext: canvasContext,
      viewport: viewport
    };
    var renderTask = page.render(renderContext);

    // Wait for rendering to finish
    renderTask.promise.then(function() {
      isPageRendering = false;
      if (pageRenderingQueue !== null) {
        // New page rendering is pending
        renderPage(pageRenderingQueue);
        pageRenderingQueue = null;
      }
    });
  });
 }


function renderPage(pageNumToRender = 1, zoom) {
            isPageRendering = true;
            document.getElementById('current_page_num').textContent = pageNumToRender;
            pdf.getPage(pageNumToRender).then(page => {
                const viewport = page.getViewport(zoom);
                canvas.height = viewport.height;
                canvas.width = viewport.width;  
                let renderCtx = {canvasContext ,viewport};
                page.render(renderCtx).promise.then(()=> {
                    isPageRendering = false;
                    if(pageRenderingQueue !== null) { 
                        renderPage(pageNumToRender);
                        pageRenderingQueue = null; 
                    }
                });        
            }); 
    }


 function renderPageQueue(pageNum) {
            if(pageRenderingQueue != null) {
                pageRenderingQueue = pageNum;
            } else {
                renderPage(pageNum);
            }
    }


 function renderNextPage(ev) {
        if(currentPageNum >= totalPages) {
            alert("This is the last page");
            return ;
        } 
        currentPageNum++;
        renderPageQueue(currentPageNum);
    }


 function renderPreviousPage(ev) {
        if(currentPageNum<=1) {
            alert("This is the first page");
            return ;
        }
        currentPageNum--;
        renderPageQueue(currentPageNum);
    }



 function goToPageNum(ev) {
        let numberInput = document.getElementById('page_num');
        let pageNumber = parseInt(numberInput.value);
        if(pageNumber) {
            if(pageNumber <= totalPages && pageNumber >= 1){
                currentPageNum = pageNumber;
                numberInput.value ="";
                renderPageQueue(pageNumber);
                return ;
            }
        }
            alert("Enter a valide page numer");
    }
    

 function zoomin(){
            if(pdf == null) return;
            zoom += 0.5;
            renderPageQueue(currentPageNum);
        }


 function zoomout(){
            if(pdf == null) return;
            zoom -= 0.5;
            renderPageQueue(currentPageNum);
        }

init();