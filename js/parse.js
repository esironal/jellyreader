// Generated by CoffeeScript 1.6.3
var FeedItem, FeedSite, load_rss_feed, sync_object;

sync_object = {
  "GDrive": {
    "key": "762177952485-isd11r5irt52dgdn2hriu2rd90e84vr2.apps.googleusercontent.com",
    "scope": "https://www.googleapis.com/auth/drive",
    "app_name": "jellyreader"
  },
  "Dropbox": {
    "key": "q5yx30gr8mcvq4f",
    "secret": "qy64qphr70lwui5",
    "app_name": "jellyreader"
  }
};

Nimbus.Auth.setup(sync_object);

/*
  reader models
*/


FeedItem = Nimbus.Model.setup('FeedItem', ['link', 'title', 'description', 'author', 'updated', 'feed', 'read', 'star', 'image', "content", "site"]);

FeedSite = Nimbus.Model.setup('FeedSite', ['title', 'link', 'type', 'description', 'updated', "icon"]);

Nimbus.Auth.set_app_ready(function() {
  console.log("app ready called");
  if (Nimbus.Auth.authorized()) {
    $('.app_spinner').show();
    FeedItem.sync_all(function() {
      return FeedSite.sync_all(function() {
        $("#loading").addClass("loaded");
        $('.app_spinner').hide();
        return angular.element(document.getElementById('app_body')).scope().load();
      });
    });
  }
});

/*
  main reader class
*/


window.CORS_PROXY = "http://192.241.167.76:9292/";

load_rss_feed = function(url) {
  var feedSite, obj, protocl, rss;
  protocl = 'http://';
  if (url.indexOf('https://') === 0) {
    protocl = 'https://';
  }
  url = protocl + url.replace('http://', '').replace('https://', '');
  Reader.cache = {
    'url': url,
    'icon': ''
  };
  if (rss = Reader.get_rss(url)) {
    feedSite = FeedSite.findByAttribute('link', Reader.cache.url);
    if (!feedSite) {
      console.log('create site');
      obj = {
        name: "",
        link: rss,
        type: "",
        description: "",
        updated: "",
        icon: Reader.cache.icon
      };
      feedSite = FeedSite.create(obj);
    }
    if (!feedSite.icon) {
      Reader.get_icon(feedSite.link, function(icon_url) {
        feedSite.icon = icon_url;
        return feedSite.save();
      });
    }
    return Reader.get_feeds(feedSite.link, function(data) {
      if (data) {
        process_data(data, feedSite);
        return angular.element(document.getElementById('app_body')).scope().load();
      }
    });
  } else {
    console.log('not valid');
    iosOverlay({
      icon: 'img/cross.png',
      text: 'Invalid Url',
      duration: 1500
    });
    return $('span.spinner').hide();
  }
};

window.process_data = function(data, site) {
  var feedItem, image, item, obj, _i, _len, _ref, _results;
  site.title = data.title;
  site.description = data.description;
  site.type = data.type;
  site.updated = data.updated;
  site.save();
  if (!data.items) {
    return;
  }
  _ref = data.items;
  _results = [];
  for (_i = 0, _len = _ref.length; _i < _len; _i++) {
    item = _ref[_i];
    feedItem = FeedItem.findByAttribute('title', item.title);
    image = Reader.get_first_image(item.content || item.description);
    if (!feedItem) {
      obj = {
        'link': item.link,
        'title': item.title,
        'description': btoa(encodeURIComponent(item.description)),
        'author': item.author,
        'updated': item.updated,
        'feed': data.link,
        'read': false,
        'star': false,
        'content': (item.content != null) && item.content !== "" ? btoa(encodeURIComponent(item.content)) : void 0,
        'site': data.title
      };
      feedItem = FeedItem.create(obj);
      console.log('create new: ' + item.title);
    } else {
      feedItem.title = item.title;
      feedItem.description = btoa(encodeURIComponent(item.description));
      feedItem.author = item.author;
      feedItem.updated = item.updated;
      feedItem.feed = data.link;
      if ((item.content != null) && item.content !== "") {
        feedItem.content = btoa(encodeURIComponent(item.content));
      }
      feedItem.site = data.title;
      console.log('updatea : ' + item.title);
    }
    if (!feedItem.image) {
      feedItem.image = image;
    }
    _results.push(feedItem.save());
  }
  return _results;
};

window.refresh = function() {
  window.total_refresh_task = FeedSite.all().length;
  window.current_refresh_task = 0;
  return start_next_task();
};

window.start_next_task = function() {
  var site;
  if (window.current_refresh_task === total_refresh_task) {
    return;
  }
  site = FeedSite.all()[window.current_refresh_task];
  return Reader.get_feeds(site.link, function(data) {
    process_data(data, site);
    window.current_refresh_task++;
    if (window.current_refresh_task < window.total_refresh_task) {
      return start_next_task();
    } else {
      window.current_refresh_task = 0;
      return angular.element(document.getElementById('app_body')).scope().load();
    }
  });
};

$(function() {
  var EffecktDemos;
  if (localStorage['state']) {
    $('.spinner').show();
  }
  $("#login_dropbox").click(function() {
    console.log("Auth button clicked");
    return Nimbus.Auth.authorize('Dropbox');
  });
  $("#login_gdrive").click(function() {
    console.log("Auth button clicked");
    return Nimbus.Auth.authorize('GDrive');
  });
  $("#logout").click(function() {
    $("#loading").removeClass("loaded");
    return Nimbus.Auth.logout();
  });
  $("#refresh").click(function() {
    return refresh();
  });
  if (document.URL.slice(0, 6) === "chrome") {
    log("Chrome edition authentication");
    chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
      if (tab.title === "API Request Authorized - Dropbox") {
        chrome.tabs.remove(tabId);
        return Nimbus.Client.Dropbox.get_access_token(function(data) {
          localStorage["state"] = "Working";
          if (Nimbus.Auth.authorized_callback != null) {
            Nimbus.Auth.authorized_callback();
          }
          Nimbus.Auth.app_ready_func();
          console.log("NimbusBase is working! Chrome edition.");
          return Nimbus.track.registered_user();
        });
      }
    });
  }
  EffecktDemos = {
    init: function() {
      return $(window).load(function() {
        return $(".no-transitions").removeClass("no-transitions");
      });
    }
  };
  return EffecktDemos.init();
});
