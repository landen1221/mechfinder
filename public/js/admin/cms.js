var cms = {
    contents: [],
    currentTab: '',

    init: function() {
        console.log('cms initialized');
        cms.contents = CONTENTS;
        // if(util.is.nil(cms.contents)) return window.location.reload(true);

        console.log(cms.contents);

        for(var i=0; i<cms.contents.length; i++) {
            var content = cms.contents[i];
            tinymce.init({
                selector: '#contentTextarea' + content._id,
                plugins: 'code hr',
                toolbar: [
                    'styleselect formatselect fontsizeselect',
                    'cut copy paste | undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent blockquote | removeformat | subscript superscript | code | hr'
                ],
                menubar: false,
                height: 600
            }); 
        }
        
        tinymce.init({
            selector: '#contentTextareaNew',
            plugins: 'code hr',
            toolbar: [
                'styleselect formatselect fontsizeselect',
                'cut copy paste | undo redo | bold italic underline strikethrough | alignleft aligncenter alignright alignjustify | bullist numlist | outdent indent blockquote | removeformat | subscript superscript | code | hr'
            ],
            menubar: false,
            height: 600
        });
        
        cms.clicks.init();

        cms.switchTab(cms.contents[0]._id);
    },

    contentWithId: function(id, index) {
        index = (typeof index === 'boolean') ? index : false;

        for(var i=0; i<cms.contents.length; i++) {
            if(cms.contents[i]._id == id) {
                if(index) return i;
                else return cms.contents[i];
            }
        }
        return null;
    },

    clicks: {
        clicked: {
            save: false,
            reset: false,
            tab: false,
            scrub: false
        },
        can: {
            save: true,
        },

        init: function() {
            for(var i=0; i<cms.contents.length; i++) {
                var content = cms.contents[i];
                $('#contentSave'+content._id).off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(e.type !== 'touchmove' && !cms.clicks.clicked.save) {
                        cms.clicks.clicked.save = true;
                        setTimeout(function() {
                            cms.clicks.clicked.save = false;
                        }, 300);

                        var id = $(this).attr('data-id');
                        cms.saveContent(id);
                    }
                });

                $('#contentReset'+content._id).off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(e.type !== 'touchmove' && !cms.clicks.clicked.reset) {
                        cms.clicks.clicked.reset = true;
                        setTimeout(function() {
                            cms.clicks.clicked.reset = false;
                        }, 300);

                        var id = $(this).attr('data-id');
                        cms.resetContent(id);
                    }
                });

                $('#contentScrub'+content._id).off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(e.type !== 'touchmove' && !cms.clicks.clicked.scrub) {
                        cms.clicks.clicked.scrub = true;
                        setTimeout(function() {
                            cms.clicks.clicked.scrub = false;
                        }, 300);

                        var id = $(this).attr('data-id');
                        cms.scrubContent(id);
                    }
                });

                $('#cmsTab'+content._id).off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(e.type !== 'touchmove' && !cms.clicks.clicked.tab) {
                        cms.clicks.clicked.tab = true;
                        setTimeout(function() {
                            cms.clicks.clicked.tab = false;
                        }, 300);

                        var id = $(this).attr('data-id');
                        cms.switchTab(id);
                    }
                });
            }

            $('#cmsTabNew').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if (e.type !== 'touchmove' && !cms.clicks.clicked.tab) {
                    setTimeout(function() {
                        cms.clicks.clicked.tab = false;
                    }, 300);

                    $('#contentWrapper'+cms.currentTab).hide();
                    $('#contentWrapperNew').show();
                    cms.currentTab = 'New';
                }
            });

            $('#contentSaveNew').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type !== 'touchmove' && !cms.clicks.clicked.save) {
                    cms.clicks.clicked.save = true;
                    setTimeout(function() {
                        cms.clicks.clicked.save = false;
                    }, 300);

                    cms.saveNewContent();
                }
            });
        }
    },

    switchTab: function(id) {
        var content = cms.contentWithId(id);
        if(util.is.nil(content)) return null;

        $('#contentWrapper'+cms.currentTab).hide();
        $('#contentWrapper'+content._id).show();
        cms.currentTab = id;
    },

    resetContent: function(id) {
        var content = cms.contentWithId(id);
        if(util.is.nil(content)) return null;

        console.log('resetting content with id: ' + id);
        var mce = tinyMCE.get('contentTextarea'+id);
        if(util.is.nil(mce)) return null;

        mce.setContent(content.markup);
    },

    scrubContent: function(id) {
        var content = cms.contentWithId(id);
        if(util.is.nil(content)) {
            return null;
        }

        console.log('stripping content with id: ' + id);
        var mce = tinyMCE.get('contentTextarea' + id);
        if(util.is.nil(mce)) {
            return null;
        }

        var $htmlElements = $(content.markup);
        $htmlElements.find('*')
            .css('margin', '')
            .css('padding', '')
            .css('font-family', '')
            .css('line-height', '')
            .css('width', '')
            .css('font-size','');
        $htmlElements
            .css('margin', '')
            .css('padding', '')
            .css('font-family', '')
            .css('color', '')
            .css('line-height', '')
            .css('width', '')
            .css('font-size','');

        var newContent = '';
        $htmlElements.each(function(i) {
            element = $(this).prop('outerHTML');
            if (typeof element != 'undefined') {
                newContent += element;
            }
        });
        console.log(newContent);
        mce.setContent(newContent);
    },

    saveContent: function(id) {
        var content = cms.contentWithId(id);
        if(util.is.nil(content)) return null;

        console.log('saving content with id: ' + id);
        var mce = tinyMCE.get('contentTextarea' + id);
        if(util.is.nil(mce)) return null;

        if(content.markup !== mce.getContent()) {
            $('#saveIcon'+id).removeClass('fa-floppy-o').addClass('fa-cog fa-spin');
            cms.clicks.can.save = false;
            
            var body = content;
            body.markup = mce.getContent();
            var request = $.ajax({
                type: 'POST',
                url: '/admin/api/content',
                data: body,
                dataType: 'json'
            });

            request.done(function(content) {
                console.log(content);
                var contentIndex = cms.contentWithId(content._id, true);
                cms.contents[contentIndex] = content;
                
                $('#saveIcon'+id).removeClass('fa-cog fa-spin').addClass('fa-floppy-o');
                cms.clicks.can.save = true;
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                $('#saveIcon'+id).removeClass('fa-cog fa-spin').addClass('fa-floppy-o');
                cms.clicks.can.save = true;
            });
        }
    },

    saveNewContent: function() {
        var mce = tinyMCE.get('contentTextareaNew');
        if (util.is.nil(mce)) {
            return null;
        }

        var title = $('#newTitleInput').val();
        if (util.is.nil(title)) {
            alert('You gotta enter a title at the top there before you can save');
            return null;
        }

        $('#saveIconNew').removeClass('fa-floppy-o').addClass('fa-cog fa-spin');
        cms.clicks.can.save = false;
        
        var body = {
            markup: mce.getContent(),
            title: title
        };
        console.log(body);

        var request = $.ajax({
            type: 'POST',
            url: '/admin/api/addContent',
            data: body,
            dataType: 'json'
        });

        request.done(function(content) {
            console.log(content);
            
            $('#saveIconNew').removeClass('fa-cog fa-spin').addClass('fa-floppy-o');
            cms.clicks.can.save = true;
            window.location.reload(true);
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            $('#saveIconNew').removeClass('fa-cog fa-spin').addClass('fa-floppy-o');
            cms.clicks.can.save = true;
        });
    }
};

$(document).ready(function() {
    cms.init();
});