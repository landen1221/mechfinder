$(document).ready(function(e) {
    mfModal.init();
});

var messageModalTemplate = $('#message-modal').html();
if(messageModalTemplate) {
    var template = Handlebars.compile(messageModalTemplate);
}

function deleteEntry(entry) {
    $(entry).remove();
}

function removeFromFavoritesListener() {
    var templateSource = $('#delete-modal').html();
    if(templateSource) {
        var template = Handlebars.compile(templateSource);
        var html = template();
    }


    $('.favorite-action').on('click', function(e) {
        e.stopPropagation();
        if (mfModal.modalIsOpen) {
            setModalContents(html);
            attachEvents();
        } else {
            mfModal.currentRecord = $(this).closest('tr');
            renderModal(html);
        }
    });
}

function removeFromFavoritesAction() {
    $('button.delete-entry').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        if (mfModal.modalIsOpen) {
            $('#mf-floating-box').stop().fadeOut(300);
            mfModal.modalIsOpen = false;
        }
        mfModal.currentRecord.remove();
        detachEvents();
        attachEvents();
    });
}

function sendMessageListener() {

    $('.contact-action').on('click touchstart', function(e) {
        var data = {};
        e.stopPropagation();
        if (mfModal.modalIsOpen === "true") {

            data.person = mfModal.currentRecord.find('.result-customer').text();

            var html = template(data);
            setModalContents(html);
            attachEvents();
        } else {
            mfModal.currentRecord = $(this).closest('tr');
            var tableType = mfModal.currentRecord.closest('table').data('table-type');
            var modalContent;

            switch (tableType) {
                case 'favorite-mechanics-table':
                    {
                        data.person = mfModal.currentRecord.find('.result-profile .profile-card .profile-info .name').text();

                        modalContent = template(data);
                        renderModal(modalContent);
                    };
                    break;
                case 'favorite-customers-table':
                    {
                        data.person = mfModal.currentRecord.find('.result-customer').text();
                        modalContent = template(data);
                        renderModal(modalContent);
                    };
                    break;
            }
        }
        return;
    });
}

function setModalContents(content) {
    $('#mf-floating-rows').html(content);
}

function attachEvents(record) {
    removeFromFavoritesListener(record);
    removeFromFavoritesAction();
    sendMessageListener(record);
}

function detachEvents() {
    $('.favorite-action').off('click');
}

function renderModal(modalContent) {
    if (!mfModal.clickedFlag) {
        mfModal.clickedFlag = true;
        setTimeout(function() {
            mfModal.clickedFlag = false;
        }, 300);

        setModalContents(modalContent);
        $('#mf-floating-box').stop().fadeIn(300);

        attachEvents();

        mfModal.modalIsOpen = true;
        $('#mf-floating-exit-button').off('click touchstart').on('click touchstart', function(e) {
            if (!mfModal.exitFlag) {
                mfModal.exitFlag = true;
                setTimeout(function() {
                    mfModal.exitFlag = false;
                }, 300);

                $('#mf-floating-box').stop().fadeOut(300);
                detachEvents();
                attachEvents();
                mfModal.modalIsOpen = false;
            }
        });
    }
}

var mfModal = {
    clickedFlag: false,
    exitFlag: false,
    modalIsOpen: false,
    currentRecord: '',

    init: function() {
        // add class stop-popup to any element (such as buttons and anchors) that you don't want to open the popup
        // add class floating-hide to any td that you don't want to show up in the floating box

        attachEvents();

        $('table.mf-mobile-table tr td').on('click touchstart', function(e) {
            if ($(window).width() <= 992) {
                // e.stopPropagation();
                e.preventDefault();
                var stopPopup = $(event.target).hasClass('stop-popup');
                mfModal.currentRecord = $(this).closest('tr');

                if (!stopPopup) {
                    var table = mfModal.currentRecord.closest('table');
                    if (!mfModal.currentRecord.hasClass('mf-mobile-table-colheading')) {
                        var modalContent = "";

                        mfModal.currentRecord.children('td').each(function(index, td) {
                            if (!$(td).hasClass('floating-hide')) {
                                // get associated table header
                                th = $(td).closest('table').find('th').eq($(td).index());
                                if (th.length < 1) {
                                    th = $(td).closest('table').find('tr.mf-mobile-table-colheading').find('td').eq($(td).index());

                                    if (th.length < 1) {
                                        th = $(td).closest('table').find('tr.colnames').find('td').eq($(td).index());
                                    }
                                }

                                modalContent += '<div class="mf-floating-row ' + th.data('modal-label') + '">';
                                if (th.length > 0 && !(th.html() == '' || th.html() == ' ' || th.html() == '&nbsp;')) {
                                    console.log(th.html());
                                    modalContent += '<div class="mf-floating-heading ' + th.data('modal-label') + '">';
                                    modalContent += th.html();
                                    modalContent += ':</div>';
                                }

                                modalContent += '<div class="mf-floating-content">';
                                modalContent += $(td).html();
                                modalContent += '</div>';
                                modalContent += '</div>';
                            }
                        });
                        renderModal(modalContent);
                    }
                }
            }
        });
    }
}
