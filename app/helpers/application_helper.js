exports.inputDesc = function (id) {
  return '<small>' + this.viewContext.icon('info-sign') + this.viewContext.t('models.Loan.descriptions.' + id) + '</small>';
};

var tagsToReplace = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;'
};

function replaceTag(tag) {
    return tagsToReplace[tag] || tag;
}

function safe_tags_replace(str) {
    str = str && str.toString();
    return str && str.replace(/[&<>]/g, replaceTag);
}

exports.startTable = function (r, obj) {
  var t = this.viewContext.t;
  return {
    row: function (field) {
      return '<tr class="table-row-' + field + '"><th>' +  t('models.' + r + '.fields.' + field) + '</th><td>' + safe_tags_replace(obj[field]) + '</td></tr>';
    }
  };
};

exports.errorsFor = function (resource, rname) {
  var out = '';
  var h = this.viewContext;

  if (resource.errors) {
      out += h.tag('div', h.html(printErrors()), {class: 'alert alert-error'});
  }

  return out;

  function printErrors() {
      var out = '<p>';
      out += h.tag('strong', h.t('validation.failed'));
      out += '</p>';
      for (var prop in resource.errors) {
          if (resource.errors.hasOwnProperty(prop)) {
              out += '<ul>';
              resource.errors[prop].forEach(function (msg) {
                  out += h.tag('li', h.t('models.' + rname + '.fields.' + prop) + ' ' + h.t(msg), {class: 'error-message'});
              });
              out += '</ul>';
          }
      }
      return out;
  }
};
