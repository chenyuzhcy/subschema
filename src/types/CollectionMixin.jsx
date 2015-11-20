"use strict";

import React, {Component} from 'react';
import Editor from '../Editor';
import Constants from '../Constants';
import ValueManager from '../ValueManager';
import BasicFieldMixin from '../BasicFieldMixin';
import LoaderMixin from '../LoaderMixin';
import NewChildContext from '../NewChildContext.jsx';
import tu from '../tutils';
import ObjectType from './Object.jsx';
import PropTypes from '../PropTypes';
import map from 'lodash/collection/map';
import style from 'subschema-styles/CollectionMixin-style';
import css from '../css';
import listen from '../decorators/listen';
import template from '../decorators/template';

class EditChildContext extends Component {
    static propTypes = {
        valueManager: PropTypes.valueManager,
        loader: PropTypes.loader,
        path: PropTypes.string.isRequired
    }
    static childContextTypes = {
        valueManager: PropTypes.valueManager,
        loader: PropTypes.loader,
        parentValueManager: PropTypes.valueManager
    }

    getChildContext() {
        var parentValueManager = this.props.valueManager;
        var {loader,path} = this.props;
        var {...value} = this.props.value || parentValueManager.path(path);
        var valueManager = this.valueManager = ValueManager(value, parentValueManager.getErrors());
        return {valueManager, parentValueManager, loader};
    }

    @listen("submit", null, false)
    handleSubmit = (e)=> {
        //t(e, vm.getErrors(), vm.getValue(), this.props.path)
        var value = this.valueManager.getValue(), errors = this.valueManager.getErrors();
        var currentPath = tu.path(this.props.path, value.key);
        if (this.props.onSubmit(e, errors, value, currentPath) !== false) {
            this.props.valueManager.update(currentPath, value.value);
            if (this.props.childPath && value.key !== this.props.childPath) {
                this.props.valueManager.update(tu.path(this.props.path, this.props.childPath), void(0));
            }
        }

        return false;
    }

    render() {
        return React.cloneElement(this.props.children, {onSubmit: this.handleSubmit});
    }
}

function wrapFunc(value, key) {
    return {value, key}
};

export default class CollectionMixin extends Component {

    static listClassName = Constants.listClassName;

    static itemTemplate = 'ListItemTemplate';

    static contextTypes = {
        loader: PropTypes.loader,
        valueManager: PropTypes.valueManager
    }

    static propTypes = {
        value: PropTypes.object,
        canEdit: PropTypes.bool,
        canReorder: PropTypes.bool,
        canDelete: PropTypes.bool,
        canAdd: PropTypes.bool,
        inline: PropTypes.bool,
        labelKey: PropTypes.path,
        createTemplate: PropTypes.template,
        buttonTemplate: PropTypes.template
    }

    static defaultProps = {
        createTemplate: 'CollectionCreateTemplate',
        buttonTemplate: 'ButtonTemplate'
    }

    constructor(props) {
        super(props);
        this.state = {};
    }

    getValue() {
        return this.unwrap(this.state.wrapped);
    }

    setValue(value) {
        this.setState({wrapped: map(value, wrapFunc)});
    }

    setErrors(errors) {
        this.setState({errors});
    }

    handleMoveUp = (pos, val) => {
        var values = this.state.wrapped, oval = values && values.concat();
        values.splice(Math.max(pos - 1, 0), 0, values.splice(pos, 1)[0]);
        this.changeValue(values, oval);
    }

    handleMoveDown = (pos, val)=> {
        var values = this.state.wrapped, oval = values && values.concat();
        values.splice(Math.min(pos + 1, values.length), 0, values.splice(pos, 1)[0]);
        this.changeValue(values, oval);

    }

    handleDelete = (pos, val, pid)=> {
        var values = this.state.wrapped, oval = values && values.concat();
        values.splice(pos, 1);
        this.changeValue(values, oval);
    }

    handleEdit = (pos, val, pid) => {
        this.setState({
            showAdd: false,
            showEdit: true,
            editPid: pid,
            editValue: {
                value: val,
                key: pid
            }
        });
    }

    changeValue = (newValue, oldValue)=> {
        if (this.triggerChange(this.unwrap(newValue)) !== false) {

            this.setState({
                wrapped: newValue,
                showAdd: false,
                showEdit: false,
                editValue: null
            });
        }
    }

    handleAddBtn = (e) => {
        e && e.preventDefault();
        this.setState({showAdd: true, editValue: this.newValue()});
    }

    handleCancelAdd = (e) => {
        e && e.preventDefault();
        this.setState({showAdd: false, showEdit: false, editValue: null});
    }

    handleBtnClick = (e, action)=> {

        if (action !== 'submit') {
            e && e.preventDefault();
            this.setState({
                showAdd: false,
                showEdit: false,
                editValue: null,
                editPid: null
            });
        }

    }

    handleSubmit = (e, errors, value)=> {
        e && e.preventDefault();
        if (errors == null || Object.keys(errors).length === 0) {
            this.setState({
                showAdd: false,
                showEdit: false,
                editValue: null,
                editPid: null
            });
        }
    }

    renderAddEditTemplate(edit, create) {
        var handler, label = ''
        if (edit) {
            handler = this.handleEditValue;
            label = 'Save'
        } else if (create) {
            handler = this.handleAddValue;
            label = 'Create'
        } else {
            return null;
        }
        var title = this.props.title || '';
        return (
            <EditChildContext {...this.context} onSubmit={this.handleSubmit} path={this.props.path}
                                                childPath={this.state.editPid} value={this.state.editValue}>
                <ObjectType key="addEdit" template={this.props.createTemplate}
                            onButtonClick={this.handleBtnClick}
                            schema={this.createItemSchema()}
                            title={this.props.inline && edit ? false : create ? 'Create ' + title : 'Edit ' + title  }

                />
            </EditChildContext>)
    }

    @template('buttonTemplate')
    renderAddBtn(Template) {
        if (!this.props.field.canAdd) {
            return null;
        }
        return <Template ref="addBtn" key="addBtn" buttonClass={style.addBtn} label="Add"
                         onClick={this.handleAddBtn}><i className={style.iconAdd}/>
        </Template>

    }

    renderAdd() {
        var field = this.props.field;
        if (!(field.canAdd || field.canEdit)) {
            return null;
        }
        var {showAdd, showEdit} = this.state;
        return showAdd || showEdit ?
            showAdd || showEdit && !this.props.inline ? this.renderAddEditTemplate(showEdit, showAdd) : null
            : this.renderAddBtn();
    }

    createItemSchema() {
        return {
            schema: this.getTemplateItem(),
            fieldsets: [{
                fields: ['value', 'key'],
                buttons: {
                    buttonsClass: 'btn-group pull-right',
                    buttons: [{label: 'Cancel', action: 'cancel', buttonClass: 'btn btn-default'}
                        , {label: 'Save', type: 'submit', action: 'submit', buttonClass: 'btn-primary btn'}]
                }
            }]

        }
    }

    @template('itemTemplate')
    render(ListItemTemplate) {
        var {name,  itemType, errors, canReorder, canDelete, canEdit, canAdd, path,field} = this.props, item = (!itemType || tu.isString(itemType)) ? {
            type: itemType || 'Text',
            name: name
        } : itemType, values = this.state.wrapped || [], length = values.length;
        item.canReorder = canReorder;
        item.canDelete = canDelete;
        item.canEdit = canEdit;
        var itemToString = this.itemToString();
        return (<div className={css.forField(this, 'list-editor')}>
            {this.renderAdd()}
            <ul>
                {values.map((v, i) => {
                    var path = tu.path(path, v.key);
                    return <ListItemTemplate key={path} pos={i} path={path}
                                             onMoveUp={this.handleMoveUp}
                                             onMoveDown={this.handleMoveDown} onDelete={this.handleDelete}
                                             onEdit={this.handleEdit}

                                             field={item}
                                             pid={v.key}
                                             itemToString={itemToString}
                                             value={v} errors={errors} last={i + 1 === length}>
                        {this.props.inline && this.state.editPid === v.key ? this.renderAddEditTemplate(v, false) : null}
                    </ListItemTemplate>
                    })}
            </ul>
        </div>);
    }

}
