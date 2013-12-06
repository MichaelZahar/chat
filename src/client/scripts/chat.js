window.onload = function () {
    var socket = io.connect();
    
    socket.on("connect", function () {
        socket.emit("join", prompt("What's your nickname?"));

        document.getElementById("chat").style.display = "block";

        socket.on("announcement", function (msg) {
            var li = document.createElement("li");

            li.className = "announcement";
            li.innerHTML = msg;

            document.getElementById("messages").appendChild(li);
        });
    });

    function addMessage(from, text, fromMe) {
        var li = document.createElement("li");
        if (!fromMe) {
	    li.className = "confirmed";
	} else {
	    li.className = "message";
	}
        li.innerHTML = "<b>" + from + "</b>: " + text;
        document.getElementById("messages").appendChild(li);

        return li;
    }

    var input = document.getElementById("input");

    document.getElementById("form").onsubmit = function () {
        var li = addMessage("me", input.value, true);
        
        socket.emit("text", input.value, function (date) {
            li.className = "confirmed";
            li.title = date;
        });

        input.value = "";
        input.focus();

        return false;
    };
    
    socket.on("text", addMessage);

    var form = document.getElementById("dj"),
        results = document.getElementById("results");

    form.style.display = "block";
    form.onsubmit = function () {
        results.innerHTML = "";
        socket.emit("search", document.getElementById("s").value, function (songs) {
            songs.forEach(function (song) {
                var result = document.createElement("li"),
                    a = document.createElement("a");

                result.innerHTML = song.ArtistName + " - <b>" + song.SongName + "</b>";
                a.href = "#";
                a.innerHTML = "Select";

                a.onclick = function () {
                    socket.emit("song", song);
                    play(song);
                    return false;
                };

                result.appendChild(a);
                results.appendChild(result);
            });
        });

        return false;
    };

    var playing = document.getElementById("playing");

    function play(song) {
        if (!song) return;

        playing.innerHTML = "<hr><b>Now Playing: </b>" + song.ArtistName + " " + song.SongName + "<br>";

        var iframe = document.createElement("iframe");
        
        iframe.frameborder = 0;
        iframe.src = song.Url;

        playing.appendChild(iframe);
    }

    socket.on("song", play);

    socket.on("elected", function () {
        form.className = "isDJ";
    });
}
