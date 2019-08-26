if (document.getElementById("pageMarker_canvas") && document.getElementById("pageMarker_draggable")) {
    $("#pageMarker_draggable").toggle();
} else {
    var erase_drawing = false;
    var stop = false;
    var canvas = document.createElement("canvas");
    canvas.id = "pageMarker_canvas";
    canvas.width = document.body.clientWidth;
    canvas.height = $(document).height();
    document.body.appendChild(canvas);
    var draggable = document.createElement("div");
    draggable.id = "pageMarker_draggable";
    document.body.appendChild(draggable);
    $("#pageMarker_draggable").append('<div id="pageMarker_color"><div class="pageMarker_title">Color</div><input id="pageMarker_colorSelect" type="color" value="#FF0000"></div><div id="pageMarker_tools"><div class="pageMarker_title">Tools</div><a id="pageMarker_pen"><img id="pageMarker_penImg" class="pageMarker_icon" alt="Marker" title="Marker" ></img></a><a id="pageMarker_eraser"><img id="pageMarker_eraserImg" class="pageMarker_icon"  alt="Eraser" title="Eraser"></img></a><a id="pageMarker_pointer"><img id="pageMarker_pointerImg" class="pageMarker_icon" alt="Pointer" title="Pointer"></img></a><a id="pageMarker_save"><img id="pageMarker_saveImg" class="pageMarker_icon" alt="Save" title="Save Drawing"></img></a></div><div class="pageMarker_title">Size</div><input type="range" id="pageMarker_thicknessSlider" value="5" max="40" min="1"></div><input type="button" value="Clear" id="pageMarker_clear" class="pageMarker_button"><input type="button" value="Close" id="pageMarker_exit" class="pageMarker_button">');

    chrome.storage.sync.get({
      pen_color: '#FF0000',
      pen_thickness: 5
    }, function(items) {
      document.getElementById("pageMarker_thicknessSlider").value = items.pen_thickness;
      $("#pageMarker_colorSelect").val(items.pen_color);
    });

    document.getElementById("pageMarker_penImg").src=chrome.extension.getURL("pen.png");
    document.getElementById("pageMarker_eraserImg").src=chrome.extension.getURL("eraser.png");
    document.getElementById("pageMarker_saveImg").src=chrome.extension.getURL("save.png");
    document.getElementById("pageMarker_pointerImg").src=chrome.extension.getURL("pointer.png");
    document.getElementById("pageMarker_pen").style.background = "rgba(0,0,0,0.2)";

    $("#pageMarker_clear").click(erase);
    $("#pageMarker_exit").click(exit);
    $("#pageMarker_save").click(save);
    $("#pageMarker_pen").click(pen);
    $("#pageMarker_pointer").click(pointer);
    $("#pageMarker_eraser").click(eraser);

    $(function() {
        $("#pageMarker_draggable").draggable({distance: 8});
    });

    var ctx, flag = false,
        prevX = 0,
        currX = 0,
        prevY = 0,
        currY = 0,
        prevtouchX = 0,
        prevtouchY = 0,
        touchX = 0,
        touchY = 0;

    if($(document).height() > 32767) {
      alert("Page Marker does not support pages with this height. Please try again on a different website.");
      exit();
    }

    ctx = canvas.getContext("2d");
    var fromTop = document.body.scrollTop || document.documentElement.scrollTop;
    draggable.style.top = fromTop + "px";

    w = canvas.width;
    h = canvas.height;

    window.onscroll = function() {
      if (!stop) {
        if($(document).scrollTop() > 32767) {
          alert("Unfortunately, Page Marker does not support pages with this height. Please try again on a different website.");
          exit();
        }
        if($(document).height() != document.getElementById('pageMarker_canvas').height) {
          var save = ctx.getImageData(0, 0, document.body.clientWidth, $(document).height());
          document.getElementById('pageMarker_canvas').width = document.body.clientWidth;
          document.getElementById('pageMarker_canvas').height = $(document).height();
          w = document.getElementById('pageMarker_canvas').width;
          h = document.getElementById('pageMarker_canvas').height;
          ctx.putImageData(save, 0, 0);
        }
        var fromTop = document.body.scrollTop || document.documentElement.scrollTop;
        draggable.style.top = fromTop + "px";
      }
    };

    canvas.addEventListener("mousemove", function(e) {
        findxy('move', e)
    }, false);
    canvas.addEventListener("mousedown", function(e) {
        findxy('down', e)
    }, false);
    canvas.addEventListener("mouseup", function(e) {
        findxy('up', e)
    }, false);
    canvas.addEventListener("mouseout", function(e) {
        findxy('out', e)
    }, false);
    canvas.addEventListener('touchstart', sketchpad_touchStart, false);
    canvas.addEventListener('touchmove', sketchpad_touchMove, false);

    $(document).keydown(function(e) {
        if (!stop) {
            switch (e.which) {
                case 88:
                    erase();
                    break;
                case 27:
                    exit();
                    break;
            }
        }
    });

    function draw() {
      var color = document.getElementById("pageMarker_colorSelect").value;
      var thickness = document.getElementById("pageMarker_thicknessSlider").value;
        ctx.beginPath();
        if(erase_drawing) {
          ctx.globalCompositeOperation="destination-out";
          ctx.lineWidth = thickness * 1.5;
          ctx.strokeStyle = color;
          ctx.lineJoin = "round";
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(currX, currY);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.globalCompositeOperation="source-over";
          ctx.lineWidth = thickness;
          ctx.strokeStyle = color;
          ctx.lineJoin = "round";
          ctx.moveTo(prevX, prevY);
          ctx.lineTo(currX, currY);
          ctx.closePath();
          ctx.stroke();
        }
    }

    function drawTouch(x, y) {
        var thickness = document.getElementById("pageMarker_thicknessSlider").value;
        var color = document.getElementById("pageMarker_colorSelect").value;
        ctx.beginPath();
        if(erase_drawing) {
          ctx.globalCompositeOperation="destination-out";
          ctx.lineWidth = thickness * 1.5;
          ctx.strokeStyle = color;
          ctx.lineJoin = "round";
          ctx.moveTo(prevtouchX, prevtouchY);
          ctx.lineTo(x, y);
          ctx.closePath();
          ctx.stroke();
        } else {
          ctx.globalCompositeOperation="source-over";
          ctx.lineWidth = thickness;
          ctx.strokeStyle = color;
          ctx.lineJoin = "round";
          ctx.moveTo(prevtouchX, prevtouchY);
          ctx.lineTo(x, y);
          ctx.closePath();
          ctx.stroke();
        }
    }

    function save() {
      var draggable = document.getElementById("pageMarker_draggable");
      $("#pageMarker_draggable").toggle(function(){
        if(draggable.style.display=="none") {
          chrome.runtime.sendMessage({from: "content_script"}, function(response) {
            screenshot = response.screenshot
            let date = new Date();
            let fileDate = date.getFullYear() + "-" + ("0" + (date.getMonth() + 1)).slice(-2).toString() + "-" + ("0" + date.getDate()).slice(-2);
            var e = document.createElement("a");
            e.download = "Screenshot_" + fileDate + "_PageMarker.png", e.href = screenshot, document.body.appendChild(e), e.click(),
            document.body.removeChild(e);
            var img = "<img width='100%' src='" + screenshot + "'></img>"
            var x = window.open();
            x.document.open();
            x.document.write(img);
            x.document.close();
            draggable.style.display = "block";
          });
        }
      });
    }

    function erase() {
      ctx.clearRect(0, 0, canvas.width-0.1, canvas.height-0.1);
    }

    function eraser() {
      erase_drawing = true;
      canvas.style.pointerEvents = "auto";
      document.getElementById("pageMarker_pen").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_pointer").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_eraser").style.background =  "rgba(0,0,0,0.2)";
    }

    function pen() {
      erase_drawing = false;
      canvas.style.pointerEvents = "auto";
      document.getElementById("pageMarker_eraser").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_pointer").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_pen").style.background =  "rgba(0,0,0,0.2)";
    }

    function pointer() {
      if(canvas.style.pointerEvents == "none") {
        canvas.style.pointerEvents = "auto";
      } else {
        canvas.style.pointerEvents = "none";
      }
      document.getElementById("pageMarker_pen").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_eraser").style.background =  "rgba(0,0,0,0)";
      document.getElementById("pageMarker_pointer").style.background =  "rgba(0,0,0,0.2)";
    }

    function exit() {
        document.getElementById("pageMarker_canvas").remove();
        document.getElementById("pageMarker_draggable").remove();
        canvas.removeEventListener("mousemove", function(e) {
            findxy('move', e)
        }, false);
        canvas.removeEventListener("mousedown", function(e) {
            findxy('down', e)
        }, false);
        canvas.removeEventListener("mouseup", function(e) {
            findxy('up', e)
        }, false);
        canvas.removeEventListener("mouseout", function(e) {
            findxy('out', e)
        }, false);
        canvas.removeEventListener('touchstart', sketchpad_touchStart, false);
        canvas.removeEventListener('touchmove', sketchpad_touchMove, false);
        stop = true;
    }

    function findxy(res, e) {
        if (res == 'down') {
            prevX = currX;
            prevY = currY;
            currX = e.pageX - canvas.offsetLeft;
            currY = e.pageY - canvas.offsetTop;
            var thickness = document.getElementById("pageMarker_thicknessSlider").value;
            ctx.beginPath();
            var color = document.getElementById("pageMarker_colorSelect").value;
            if(!erase_drawing) {
              ctx.globalCompositeOperation="source-over";
              ctx.strokeStyle = color;
              ctx.lineWidth = thickness;
              ctx.lineJoin = "round";
              ctx.moveTo(currX, currY-0.0006);
              ctx.lineTo(currX, currY);
            } else {
              ctx.globalCompositeOperation="destination-out";
              ctx.lineWidth = thickness * 1.5;
              ctx.lineJoin = "round";
              ctx.moveTo(currX, currY-0.0006);
              ctx.lineTo(currX, currY);
            }
            ctx.closePath();
            ctx.stroke();
            flag = true;
        }
        if (res == 'up' || res == "out") {
            flag = false;
        }
        if (res == 'move') {
            if (flag) {
                prevX = currX;
                prevY = currY;
                currX = e.pageX - canvas.offsetLeft;
                currY = e.pageY - canvas.offsetTop;
                draw();
            }
        }
    }

    function getTouchPos(e) {
        if (!e)
            var e = event;
        if (e.touches) {
            if (e.touches.length == 1) {
                prevtouchX = touchX;
                prevtouchY = touchY;
                var touch = e.touches[0];
                touchX = touch.pageX - touch.target.offsetLeft;
                touchY = touch.pageY - touch.target.offsetTop;
            }
        }
    }

    function sketchpad_touchStart() {
        getTouchPos();
        prevtouchX = touchX;
        prevtouchY = touchY;
        drawTouch(touchX, touchY);
        event.preventDefault();
    }

    function sketchpad_touchMove(e) {
        getTouchPos();
        drawTouch(touchX, touchY);
        event.preventDefault();
    }
}
