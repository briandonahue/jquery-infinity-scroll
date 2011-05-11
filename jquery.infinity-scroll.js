// Infinite Scroll
(function($) {
  var methods = {
    init: function(options){
      var el = $(this);
      var settings = getDefaultSettings();

      return $(this).each(function() {
        var $this = $(this);
        var data  = { currentRequest: null, maxReached: false };
        data.settings = $.extend(data.settings, settings, options);
        setData(data);
        var settings = data.settings;
        $(document).scroll(function(e) { 
          if(!settings.disabled && hasReachedScrollTrigger(settings))
            $this.infinityscroll('scroll'); 
        } );
        if(settings.loadOnInit)
          $this.infinityscroll('reset'); 
      });
    }, 
    scroll: function(options){
      return $(this).each(function() {
        _scroll($(this), options);
      });
    },
    reset: function(options){
      var data = getData(this);
      if(requestInProgress(data.currentRequest)){
        data.currentRequest.abort();
      }
      data.settings.page = 1;
      data.settings.appendTo.empty();
      data.settings.disabled = false;
      data.settings.appendTo.empty();
      data.maxReached = false;
      $.extend(data.settings, options);
      setData(data);
      $(this).infinityscroll('scroll');
    },
    disable: function (){
      if(getData(this))
        $(this).data('infinityscroll').settings.disabled = true;
    },
    enable: function (){
      if(getData(this))
        $(this).data('infinityscroll').settings.disabled = false;
    },
    toggleDisabled: function (){
      if(getData(this))
        $(this).data('infinityscroll').settings.disabled = !$(this).data('infinityscroll').settings.disabled;
    }
  };

  function getData(el){
    return $(el).data('infinityscroll');
  }

  function setData(data){
    $(data.settings.appendTo).data('infinityscroll', data);
  }

  function getDefaultSettings(){
    return {
              url: null,
              triggerAt: 300,
              page: 1,
              resultsPerPage: 50,
              appendTo: '.list tbody',
              disabled: false,
              loadOnInit: true,
          };
  }

  function _scroll($el, options) {
    var data = getData($el);
    if(!data) return;
    $.extend(data.settings, options);
    setData(data);

    var settings = data.settings;
    if(!settings.url) return;
    if(settings.disabled || data.maxReached) return;
    if(requestInProgress(data.currentRequest)) return;
    fetchNext($el);
  }

  function requestInProgress(req){
    return (req && req.readyState < 4 && req.readyState > 0);
  }

  function hasReachedScrollTrigger(settings){
    var $appendTo = $(settings.appendTo);
    var scrollBuffer = ($appendTo.height() + $appendTo.offset().top) - ($(document).scrollTop() + $(window).height());
    var shouldScroll = (($appendTo.height() > 0) 
          && (settings.triggerAt >= scrollBuffer));
    return shouldScroll;
  }

  function fetchNext($el){
    var scrollData = getData($el);
    var settings = scrollData.settings;
    var params = settings.paramsFunc ? settings.paramsFunc() : settings.params;
    settings.appendTo.append("<tr><td colspan=\"99\"><img src=\"../../Content/img/loading-large.gif\"></td></tr>");
    scrollData.currentRequest = $.ajax({
        url: settings.url,
        type: "POST",
        cache: false,
        data: JSON.stringify({ 
                page: settings.page, 
                resultsPerPage: settings.resultsPerPage,
                params: params }),
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        success: function(data, textStatus) {
            $('tr:last', settings.appendTo).remove();
            if((data) && (data !== '')) {
              settings.renderData(data, settings.appendTo);
              settings.page++;
              $(settings.appendTo).trigger('infinityscroll.finish');
            }
            else {
              scrollData.maxReached = true;
              setData(scrollData);
              $(settings.appendTo).trigger('infinityscroll.maxreached');
            }
        },
        error: function(XMLHttpRequest, textStatus, errorThrown) {
            $('tr:last', settings.appendTo).remove()
            settings.error(XMLHttpRequest, textStatus, errorThrown);
        }
    });

  }

  $.fn.infinityscroll = function(method) {
    
    // Method calling logic
    if ( methods[method] ) {
      return methods[ method ].apply( this, Array.prototype.slice.call( arguments, 1 ));
    } else if ( typeof method === 'object' || ! method ) {
      return methods.init.apply( this, arguments );
    } else {
      $.error( 'Method ' +  method + ' does not exist on jQuery.infinityscroll' );
    }    
  
  };
})(jQuery);

