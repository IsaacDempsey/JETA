var url = "http://www.dublinbus.ie/RSS/Rss-news/";
$.ajax({
    type: 'GET',
    url: "https://api.rss2json.com/v1/api.json?rss_url=" + url,
    dataType: 'jsonp',
    success: function (data) {
        console.log(data.feed.description);
        console.log(data);
        $.each(data.items, function (i,el) {
            console.log(el);
            $('<div class="row p-3 m-3 news">' + el.title + '<a class="pl-2 knowmore_link" href="' + el.link +'" target="_blank">Know More&nbsp;<i class="fas fa-external-link-alt"></i></a></div>').appendTo('.news-feed');
        })
    }
});

