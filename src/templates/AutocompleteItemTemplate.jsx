"use strict";
import React, {Component} from 'react';
import style  from 'subschema-styles/AutocompleteItemTemplate-style';
import PropTypes from '../PropTypes';

export default class AutocompleteItemTemplate extends Component {
    static defaultProps = {
        data: null,
        value: null,
        focus: false,
        processor: null
    };

    static propTypes = {
        onSelect: PropTypes.event
    };


    handleClick(e) {
        e && e.preventDefault();
        this.props.onSelect(this.props.data);
    };

    render() {
        var {data, focus, value, processor} = this.props;
        var cls = style.item + (focus ? style.focused : '');
        var html = processor.format(data, value, true);
        return html == null ? null :
            <li ref="item" className={cls} onClick={this::this.handleClick} dangerouslySetInnerHTML={{__html: html}}/>
    }
}
