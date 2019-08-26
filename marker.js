if (document.getElementById("pageMarker_canvas") && document.getElementById("pageMarker_draggable")) {
  $("#pageMarker_draggable").toggle();
} else {
  var stop = false;
  var pen_thickness = 2;
  var stantard = 5;
  var pen_color = '#FF0000';
  var ratio = -1.4;
  var canvas = document.createElement("canvas");
  canvas.id = "pageMarker_canvas";
  canvas.width = document.body.clientWidth;
  canvas.height = $(document).height();
  document.body.appendChild(canvas);
  var draggable = document.createElement("div");
  draggable.id = "pageMarker_draggable";
  document.body.appendChild(draggable);
  $("#pageMarker_draggable").append('<div id="pageMarker_tools"><div class="pageMarker_title">Tools</div><a id="pageMarker_pen"><img id="pageMarker_penImg" class="pageMarker_icon" alt="Marker" title="Marker" ></img></a><a id="pageMarker_pointer"><img id="pageMarker_pointerImg" class="pageMarker_icon" alt="Pointer" title="Pointer"></img></a></div></div><input type="button" value="Clear" id="pageMarker_clear" class="pageMarker_button"><input type="button" value="Close" id="pageMarker_exit" class="pageMarker_button">');

  document.getElementById("pageMarker_penImg").src = chrome.extension.getURL("pen.png");
  document.getElementById("pageMarker_pointerImg").src = chrome.extension.getURL("pointer.png");
  document.getElementById("pageMarker_pen").style.background = "rgba(0,0,0,0.2)";

  $("#pageMarker_clear").click(clear);
  $("#pageMarker_exit").click(exit);
  $("#pageMarker_pen").click(pen);
  $("#pageMarker_pointer").click(pointer);

  $(function () {
    $("#pageMarker_draggable").draggable({ distance: 8 });
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

  if ($(document).height() > 32767) {
    alert("Wu's Ruler does not support pages with this height. Please try again on a different website.");
    exit();
  }

  ctx = canvas.getContext("2d");
  var fromTop = document.body.scrollTop || document.documentElement.scrollTop;
  draggable.style.top = fromTop + "px";

  w = canvas.width;
  h = canvas.height;

  window.onscroll = function () {
    if (!stop) {
      if ($(document).scrollTop() > 32767) {
        alert("Unfortunately, Wu's Ruler does not support pages with this height. Please try again on a different website.");
        exit();
      }
      if ($(document).height() != document.getElementById('pageMarker_canvas').height) {
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

  canvas.addEventListener("mousemove", function (e) {
    findxy('move', e)
  }, false);
  canvas.addEventListener("mousedown", function (e) {
    findxy('down', e)
  }, false);
  canvas.addEventListener("mouseup", function (e) {
    findxy('up', e)
  }, false);
  canvas.addEventListener("mouseout", function (e) {
    findxy('out', e)
  }, false);
  canvas.addEventListener('touchstart', sketchpad_touchStart, false);
  canvas.addEventListener('touchmove', sketchpad_touchMove, false);

  $(document).keydown(function (e) {
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
    var color = pen_color;
    var thickness = pen_thickness;
    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(currX, currY);
    ctx.closePath();
    ctx.stroke();
    ctx.font = "12px Arial";
    ctx.fillStyle = pen_color;
    if (ratio <= 0) {
      ctx.fillText("标尺未设置", currX + 10, currY + 5);
    } else {
      var len = lineDistance();
      var mm = len/ ratio;
      ctx.fillText(mm.toFixed(2)+"mm", currX + 10, currY + 5);
    }
  }

  function drawTouch(x, y) {
    var thickness = pen_thickness;
    var color = pen_color;
    ctx.beginPath();
    ctx.globalCompositeOperation = "source-over";
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    ctx.moveTo(prevtouchX, prevtouchY);
    ctx.lineTo(x, y);
    ctx.closePath();
    ctx.stroke();
  }

  function lineDistance(){
    var xs = 0;
    var ys = 0;

    xs = currX - prevX;
    xs = xs * xs;

    ys = currY - prevY;
    ys = ys * ys;

    return Math.sqrt( xs + ys );
}

  function clear() {
    ratio = -1.4;
    ctx.clearRect(0, 0, canvas.width - 0.1, canvas.height - 0.1);
  }

  function erase() {
    ctx.clearRect(0, 0, canvas.width - 0.1, canvas.height - 0.1);
  }

  function pen() {
    canvas.style.pointerEvents = "auto";
    document.getElementById("pageMarker_pointer").style.background = "rgba(0,0,0,0)";
    document.getElementById("pageMarker_pen").style.background = "rgba(0,0,0,0.2)";
  }

  function pointer() {
    if (canvas.style.pointerEvents == "none") {
      canvas.style.pointerEvents = "auto";
    } else {
      canvas.style.pointerEvents = "none";
    }
    document.getElementById("pageMarker_pen").style.background = "rgba(0,0,0,0)";
    document.getElementById("pageMarker_pointer").style.background = "rgba(0,0,0,0.2)";
  }

  function exit() {
    document.getElementById("pageMarker_canvas").remove();
    document.getElementById("pageMarker_draggable").remove();
    canvas.removeEventListener("mousemove", function (e) {
      findxy('move', e)
    }, false);
    canvas.removeEventListener("mousedown", function (e) {
      findxy('down', e)
    }, false);
    canvas.removeEventListener("mouseup", function (e) {
      findxy('up', e)
    }, false);
    canvas.removeEventListener("mouseout", function (e) {
      findxy('out', e)
    }, false);
    canvas.removeEventListener('touchstart', sketchpad_touchStart, false);
    canvas.removeEventListener('touchmove', sketchpad_touchMove, false);
    stop = true;
  }

  function findxy(res, e) {
    if (res == 'down') {
      erase();
      prevX = e.pageX - canvas.offsetLeft;
      prevY = e.pageY - canvas.offsetTop;
      flag = true;
    }
    if (res == 'up' || res == "out") {
      if (ratio <= 0 && res == 'up') {
        erase();
        currX = e.pageX - canvas.offsetLeft;
        currY = e.pageY - canvas.offsetTop;
        var len = lineDistance();
        ratio = len / stantard;
        draw();
      }
      flag = false;
    }
    if (res == 'move') {
      if (flag) {
        erase();
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
